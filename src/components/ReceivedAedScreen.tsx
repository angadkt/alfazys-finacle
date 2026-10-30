import FinacleDatePicker from './FinacleDatePicker';
import { useState, useEffect } from 'react';
import { Landmark, X, FileText, Plus, RefreshCw } from 'lucide-react';
import api from '../services/api';
import FinacleSelect from './FinacleSelect';
import ReceivedAedReceiptModal from './ReceivedAedReceiptModal';

interface Customer {
  id: string;
  name: string;
}

export default function ReceivedAedScreen() {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Receipt Modal State
  const [selectedReceiptRecord, setSelectedReceiptRecord] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const handleOpenReceipt = (rec: any) => {
    setSelectedReceiptRecord(rec);
    setIsReceiptModalOpen(true);
  };

  // Entry / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [aedAmount, setAedAmount] = useState('');
  const [modeOfTxn, setModeOfTxn] = useState('');
  const [cashStaff, setCashStaff] = useState('');
  const [remainingAed, setRemainingAed] = useState('');
  const [agentCustomer, setAgentCustomer] = useState('');
  const [utrNo, setUtrNo] = useState('');
  const [description, setDescription] = useState('');
  const [agentBalanceInfo, setAgentBalanceInfo] = useState<{
    booked_aed: number;
    already_received_aed: number;
    pending_aed: number;
  } | null>(null);
  const [, setFetchingBalance] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load Customers for Agent dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get('/records/parties');
        const list = (res.data?.records || []).map((c: any) => ({
          id: c.cif_no || c.id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.short_name || c.cif_no || 'Unknown',
        }));
        setCustomers(list);
      } catch {
        /* silent */
      }
    };
    fetchCustomers();
  }, []);

  // Option A: Auto-fetch agent balance on agentCustomer, entryDate, or modal open
  useEffect(() => {
    if (!isModalOpen || !agentCustomer.trim()) {
      setAgentBalanceInfo(null);
      return;
    }

    let active = true;
    const fetchBalance = async () => {
      setFetchingBalance(true);
      try {
        const res = await api.get('/records/received-aed/agent-balance', {
          params: {
            agent: agentCustomer.trim(),
            date: entryDate,
            exclude_id: editingId || undefined,
          },
        });
        if (active && res.data) {
          const info = {
            booked_aed: parseFloat(res.data.booked_aed) || 0,
            already_received_aed: parseFloat(res.data.already_received_aed) || 0,
            pending_aed: parseFloat(res.data.pending_aed) || 0,
          };
          setAgentBalanceInfo(info);

          // Option A: Remaining AED = max(0, pending_aed - current aedAmount)
          const currentAed = parseFloat(aedAmount) || 0;
          const rem = Math.max(0, Math.round((info.pending_aed - currentAed) * 100) / 100);
          setRemainingAed(rem > 0 ? rem.toFixed(2) : '0.00');
        }
      } catch (err) {
        console.error('Failed to fetch agent balance:', err);
      } finally {
        if (active) setFetchingBalance(false);
      }
    };

    fetchBalance();
    return () => {
      active = false;
    };
  }, [isModalOpen, agentCustomer, entryDate, editingId]);

  const handleAedAmountChange = (val: string) => {
    setAedAmount(val);
    if (agentBalanceInfo) {
      const num = parseFloat(val) || 0;
      const rem = Math.max(0, Math.round((agentBalanceInfo.pending_aed - num) * 100) / 100);
      setRemainingAed(rem > 0 ? rem.toFixed(2) : '0.00');
    }
  };

  const fetchRecords = async (p = page, fDate = fromDate, tDate = toDate, m = modeFilter, a = agentFilter) => {
    setLoading(true);
    try {
      const params: any = { page: p, limit: 50 };
      if (fDate) params.from_date = fDate;
      if (tDate) params.to_date = tDate;
      if (m) params.mode_of_txn = m;
      if (a) params.agent_customer = a;
      const res = await api.get('/records/received-aed', { params });
      setRecords(res.data.records || []);
      setTotal(res.data.total || 0);
      setPage(p);
    } catch (err) {
      console.error('Failed to load received AED records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(1, fromDate, toDate, modeFilter, agentFilter);
  }, [fromDate, toDate, modeFilter, agentFilter]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setEntryDate(new Date().toISOString().slice(0, 10));
    setAedAmount('');
    setModeOfTxn('');
    setCashStaff('');
    setRemainingAed('');
    setAgentCustomer('');
    setUtrNo('');
    setDescription('');
    setAgentBalanceInfo(null);
    setIsModalOpen(true);
  };

  const handleEdit = (rec: any) => {
    setEditingId(rec.id);
    setEntryDate(rec.entry_date ? rec.entry_date.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setAedAmount(String(rec.aed_amount || ''));
    setModeOfTxn(rec.mode_of_txn || '');
    setCashStaff(rec.cash_staff || '');
    setRemainingAed(rec.remaining_amount != null ? String(rec.remaining_amount) : '');
    setAgentCustomer(rec.agent_customer || '');
    setUtrNo(rec.utr_no || '');
    setDescription(rec.description || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this Received AED entry?')) return;
    try {
      await api.delete(`/records/received-aed/${id}`);
      fetchRecords(page, fromDate, toDate, modeFilter, agentFilter);
    } catch {
      alert('Failed to delete. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!aedAmount || parseFloat(aedAmount) <= 0) {
      alert('Please enter a valid AED amount received.');
      return;
    }
    if (!modeOfTxn) {
      alert('Please select a mode of transaction.');
      return;
    }
    if (modeOfTxn === 'BY CASH' && !cashStaff.trim()) {
      alert('Please enter the cash collection staff name.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        aed_amount: parseFloat(aedAmount),
        mode_of_txn: modeOfTxn,
        cash_staff: modeOfTxn === 'BY CASH' ? cashStaff.trim() : undefined,
        remaining_amount: remainingAed ? parseFloat(remainingAed) : undefined,
        entry_date: entryDate,
        agent_customer: agentCustomer.trim() || undefined,
        utr_no: utrNo.trim() || undefined,
        description: description.trim() || undefined,
      };

      if (editingId) {
        await api.put(`/records/received-aed/${editingId}`, payload);
      } else {
        await api.post('/records/received-aed', payload);
      }

      setIsModalOpen(false);
      fetchRecords(page, fromDate, toDate, modeFilter, agentFilter);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to save entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAedShown = records.reduce((s, r) => s + parseFloat(r.aed_amount || 0), 0);
  const totalRemainingShown = records.reduce((s, r) => s + (r.remaining_amount != null ? parseFloat(r.remaining_amount || 0) : 0), 0);

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
                Received AED Collection Register
              </h1>
              <span className="bg-[#FFB800] text-black font-extrabold text-[10px] px-2 py-0.5 rounded shadow-2xs tracking-wider">
                REC-AED
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              FINCORE Universal Settlement Module • Cash &amp; CDM Collection Journal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchRecords(page, fromDate, toDate, modeFilter, agentFilter)}
            disabled={loading}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors border border-gray-300 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-600 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-[#0E498C] hover:bg-[#00A2E8] border border-[#00B5E2]/40 text-white px-3.5 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#FFB800]" />
            <span>Add Received AED Entry</span>
          </button>
        </div>
      </div>

      {/* 2. Workspace Filter & Summary Ribbon */}
      <div className="p-4 md:px-8 border-b border-gray-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range: From & To */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-md px-2.5 h-[32px] shadow-2xs focus-within:border-[#00A2E8] focus-within:ring-1 focus-within:ring-[#00A2E8] transition-all">
            <span className="text-[#0E498C] font-bold text-[11px]">From:</span>
            <FinacleDatePicker
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent border-0 text-xs text-gray-800 min-w-[105px] h-[26px] p-0 shadow-none hover:border-0"
            />
            <span className="text-[#0E498C] font-bold text-[11px] ml-0.5">To:</span>
            <FinacleDatePicker
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent border-0 text-xs text-gray-800 min-w-[105px] h-[26px] p-0 shadow-none hover:border-0"
            />
            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={() => { setFromDate(''); setToDate(''); }}
                className="text-gray-400 hover:text-red-500 px-0.5 cursor-pointer"
                title="Clear Dates"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Agent Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-md px-2.5 h-[32px] shadow-2xs focus-within:border-[#00A2E8] focus-within:ring-1 focus-within:ring-[#00A2E8] transition-all">
            <span className="text-[#0E498C] font-bold text-[11px] whitespace-nowrap">Agent:</span>
            <FinacleSelect
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              options={[
                { value: '', label: 'All Agents' },
                ...customers.map((c) => ({
                  value: c.name,
                  label: c.name,
                })),
              ]}
              triggerClassName="min-w-[150px] max-w-[200px] h-[28px] border-0 bg-transparent px-1 text-xs"
            />
            {agentFilter && (
              <button
                type="button"
                onClick={() => setAgentFilter('')}
                className="text-gray-400 hover:text-red-500 cursor-pointer"
                title="Clear Agent"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Mode Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-md px-2.5 h-[32px] shadow-2xs focus-within:border-[#00A2E8] focus-within:ring-1 focus-within:ring-[#00A2E8] transition-all">
            <span className="text-[#0E498C] font-bold text-[11px] whitespace-nowrap">Mode:</span>
            <FinacleSelect
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              options={[
                { value: '', label: 'All Modes' },
                { value: 'CDM', label: 'CDM' },
                { value: 'BNK SLP', label: 'BNK SLP' },
                { value: 'FINAC', label: 'FINAC' },
                { value: 'BY CASH', label: 'BY CASH' },
                { value: 'MOB TRF', label: 'MOB TRF' },
                { value: 'UPI', label: 'UPI' },
                { value: 'COR NET', label: 'COR NET' },
              ]}
              triggerClassName="min-w-[120px] h-[28px] border-0 bg-transparent px-1 text-xs"
            />
            {modeFilter && (
              <button
                type="button"
                onClick={() => setModeFilter('')}
                className="text-gray-400 hover:text-red-500 cursor-pointer"
                title="Clear Mode"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => fetchRecords(1, fromDate, toDate, modeFilter, agentFilter)}
            className="h-[32px] bg-[#0E498C] hover:bg-[#00A2E8] text-white text-xs font-bold px-3.5 rounded-md cursor-pointer transition-colors shadow-2xs flex items-center justify-center"
          >
            Apply Filter
          </button>

          {(fromDate || toDate || agentFilter || modeFilter) && (
            <button
              type="button"
              onClick={() => {
                setFromDate('');
                setToDate('');
                setAgentFilter('');
                setModeFilter('');
              }}
              className="text-xs text-gray-500 hover:text-red-600 underline font-semibold ml-1 cursor-pointer"
              title="Reset All Filters"
            >
              Reset All
            </button>
          )}
        </div>

        {/* Quick Metrics & Total Badge */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="bg-[#EBF6FC] border border-[#bce2f8] px-2.5 py-1 rounded text-[#0E498C] font-semibold shadow-2xs">
            Total Records: <strong className="text-gray-900 ml-1">{total}</strong>
          </span>
          <span className="bg-[#EBF6FC] border border-[#bce2f8] px-2.5 py-1 rounded text-[#0E498C] shadow-2xs">
            Total Collected: <strong>{totalAedShown.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED</strong>
          </span>
          <span className="bg-[#fef9ec] border border-[#fae29c] border-t-2 border-t-[#FFB800] px-2.5 py-1 rounded text-[#92400e] shadow-2xs">
            Unallocated Balance: <strong>{totalRemainingShown.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED</strong>
          </span>
        </div>
      </div>

      {/* 3. Table Register with Standard Outer Padding */}
      <div className="flex-1 overflow-y-auto p-4 md:px-8 custom-scrollbar bg-slate-50">
        <div className="overflow-x-auto border border-[#c4d4ec] bg-white rounded shadow-2xs">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
              Loading Received AED records...
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <span className="text-lg font-bold text-[#0E498C] mb-1">No Received AED Records Found</span>
              <span className="text-xs text-gray-400 mb-3">Try clearing filters or add a new entry.</span>
              <button
                onClick={handleOpenAdd}
                className="bg-[#0E498C] hover:bg-[#00A2E8] border border-[#00B5E2]/40 text-white text-xs font-bold px-4 py-1.5 rounded cursor-pointer transition-colors"
              >
                + Create Received AED Entry
              </button>
            </div>
          ) : (
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-[#0E498C] text-white text-left sticky top-0 z-10 shadow-xs">
                  <th className="px-3 py-2.5 font-bold border-r border-[#20549c] whitespace-nowrap">#</th>
                  <th className="px-3 py-2.5 font-bold border-r border-[#20549c] whitespace-nowrap">Entry Date</th>
                  <th className="px-3 py-2.5 font-bold border-r border-[#20549c] whitespace-nowrap">Agent / Customer</th>
                  <th className="px-3 py-2.5 font-bold border-r border-[#20549c] whitespace-nowrap">AED Amount</th>
                  <th className="px-3 py-2.5 font-bold border-r border-[#20549c] whitespace-nowrap">Mode</th>
                  <th className="px-3 py-2.5 font-bold border-r border-[#20549c] whitespace-nowrap">UTR / Ref</th>
                  <th className="px-3 py-2.5 font-bold border-r border-[#20549c] whitespace-nowrap">Cash Staff</th>
                  <th className="px-3 py-2.5 font-bold border-r border-[#20549c] whitespace-nowrap">Remaining AED</th>
                  <th className="px-3 py-2.5 font-bold border-r border-[#20549c] whitespace-nowrap">Description</th>
                  <th className="px-3 py-2.5 font-bold border-r border-[#20549c] whitespace-nowrap">Created By</th>
                  <th className="px-3 py-2.5 font-bold whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, i) => (
                  <tr
                    key={rec.id}
                    className={`border-b border-[#e4e4e4] hover:bg-[#EBF6FC] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}`}
                  >
                    <td className="px-3 py-2 border-r border-[#e4e4e4] text-gray-500">
                      {(page - 1) * 50 + i + 1}
                    </td>
                    <td className="px-3 py-2 border-r border-[#e4e4e4] whitespace-nowrap font-medium text-gray-700">
                      {rec.entry_date
                        ? new Date(rec.entry_date.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-3 py-2 border-r border-[#e4e4e4] font-semibold text-gray-800">
                      {rec.agent_customer || <span className="text-gray-400 italic font-normal">None Specified</span>}
                    </td>
                    <td className="px-3 py-2 border-r border-[#e4e4e4] font-bold text-[#0f5132] whitespace-nowrap">
                      {parseFloat(rec.aed_amount || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                    </td>
                    <td className="px-3 py-2 border-r border-[#e4e4e4]">
                      <span className="bg-[#EBF6FC] text-[#0E498C] border border-[#bce2f8] px-2 py-0.5 rounded font-bold text-[11px]">
                        {rec.mode_of_txn}
                      </span>
                    </td>
                    <td className="px-3 py-2 border-r border-[#e4e4e4] font-mono text-gray-700 text-xs">
                      {rec.utr_no || <span className="text-gray-400 font-sans">—</span>}
                    </td>
                    <td className="px-3 py-2 border-r border-[#e4e4e4] text-gray-700">
                      {rec.cash_staff || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-2 border-r border-[#e4e4e4] whitespace-nowrap font-bold text-[#b45309]">
                      {rec.remaining_amount != null
                        ? parseFloat(rec.remaining_amount).toLocaleString('en-AE', { minimumFractionDigits: 2 }) + ' AED'
                        : <span className="text-gray-400 font-normal">—</span>}
                    </td>
                    <td className="px-3 py-2 border-r border-[#e4e4e4] text-gray-600 text-xs max-w-[200px] truncate" title={rec.description || ''}>
                      {rec.description || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-2 border-r border-[#e4e4e4] text-gray-600">
                      {rec.created_by_name || 'Admin'}
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenReceipt(rec)}
                          className="text-[#0E498C] hover:text-white bg-[#EBF6FC] hover:bg-[#00A2E8] border border-[#bce2f8] px-2 py-0.5 rounded font-bold text-[11px] cursor-pointer flex items-center gap-1 transition-colors shadow-2xs"
                          title="View, Print & Download Receipt"
                        >
                          <FileText className="w-3 h-3 text-[#0E498C]" />
                          Receipt
                        </button>
                        <button
                          onClick={() => handleEdit(rec)}
                          className="text-[#0E498C] hover:underline font-bold text-[11px] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(rec.id)}
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
                <tr className="bg-[#EBF6FC] font-bold text-[#0E498C] border-t-2 border-[#FFB800]">
                  <td className="px-3 py-2 border-r border-[#c4d4ec]" colSpan={3}>
                    Page Total ({records.length} records shown)
                  </td>
                  <td className="px-3 py-2 border-r border-[#c4d4ec] whitespace-nowrap text-[#0f5132]">
                    {totalAedShown.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                  </td>
                  <td className="px-3 py-2 border-r border-[#c4d4ec]" colSpan={3}></td>
                  <td className="px-3 py-2 border-r border-[#c4d4ec] whitespace-nowrap text-[#b45309]">
                    {totalRemainingShown.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                  </td>
                  <td className="px-3 py-2 border-r border-[#c4d4ec]" colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* Pagination Bar inside the Table Card */}
          <div className="px-4 py-2.5 bg-[#f8f9fa] border-t border-[#c4d4ec] flex items-center justify-between text-xs text-gray-600">
            <span>
              Showing <strong>{records.length}</strong> of <strong>{total}</strong> records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => fetchRecords(page - 1)}
                className="bg-white border border-[#c4d4ec] px-3 py-1 rounded hover:bg-[#EBF6FC] disabled:opacity-40 disabled:cursor-not-allowed font-medium text-[#0E498C] cursor-pointer transition-colors"
              >
                Previous
              </button>
              <span className="font-bold text-[#0E498C]">
                Page {page} of {Math.max(1, Math.ceil(total / 50))}
              </span>
              <button
                disabled={page >= Math.ceil(total / 50)}
                onClick={() => fetchRecords(page + 1)}
                className="bg-white border border-[#c4d4ec] px-3 py-1 rounded hover:bg-[#EBF6FC] disabled:opacity-40 disabled:cursor-not-allowed font-medium text-[#0E498C] cursor-pointer transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Entry Modal */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsModalOpen(false)}></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white shadow-2xl flex flex-col max-h-[90vh] max-w-xl w-full rounded-md overflow-hidden pointer-events-auto border border-[#c4d4ec]">
              {/* Header */}
              <div className="bg-[#0E498C] px-6 py-4 font-bold text-white border-b border-[#00B5E2]/40 text-[16px] flex items-center justify-between">
                <span>{editingId ? 'Edit Received AED Entry' : 'New Received AED Entry'}</span>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer text-xs font-bold"
                >
                  ✕ Close
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 overflow-auto bg-white flex flex-col gap-6">
                <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-4 text-[13px] items-center bg-[#EBF6FC] border border-[#bce2f8] rounded-md py-5 px-6">
                  {/* Entry Date */}
                  <label className="font-medium text-black whitespace-nowrap">
                    Date <span className="text-red-600">*</span>
                  </label>
                  <FinacleDatePicker
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="border border-[#c4d4ec] rounded-md h-[36px] px-3 bg-white w-full text-xs text-gray-800"
                  />

                  {/* Agent / Customer */}
                  <label className="font-medium text-black whitespace-nowrap">
                    Agent / Customer
                  </label>
                  <div className="w-full">
                    <input
                      list="received-aed-screen-agent-list"
                      type="text"
                      placeholder="Search or enter Agent / Customer..."
                      autoComplete="off"
                      value={agentCustomer}
                      onChange={(e) => setAgentCustomer(e.target.value)}
                      className="border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase focus:outline-none focus:border-[#104080] w-full text-xs"
                    />
                    <datalist id="received-aed-screen-agent-list">
                      {customers.map((c) => (
                        <option key={c.id} value={`${c.name} (${c.id})`} />
                      ))}
                    </datalist>
                  </div>

                  {/* Option A Calculation Info Banner */}
                  {agentBalanceInfo && (
                    <div className="col-span-2 -my-1 p-2.5 bg-[#e2ebf6] rounded border border-[#b6cded] text-[11px] text-[#104080] flex flex-wrap items-center justify-between gap-2 shadow-xs">
                      <div className="flex flex-wrap items-center gap-3">
                        <span>Booked: <strong>{agentBalanceInfo.booked_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED</strong></span>
                        <span className="text-gray-400">•</span>
                        <span>Already Received: <strong>{agentBalanceInfo.already_received_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED</strong></span>
                        <span className="text-gray-400">•</span>
                        <span className="text-[#0d6e5a]">Pending: <strong>{agentBalanceInfo.pending_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED</strong></span>
                      </div>
                      <span className="bg-[#104080] text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wide">
                        OPTION A AUTO-CALCULATED
                      </span>
                    </div>
                  )}

                  {/* AED Amount */}
                  <label className="font-medium text-black whitespace-nowrap">
                    AED Amount Received <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={aedAmount}
                    onChange={(e) => handleAedAmountChange(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white focus:outline-none focus:border-[#104080] w-full font-bold text-gray-800"
                  />

                  {/* Mode of Transaction */}
                  <label className="font-medium text-black whitespace-nowrap">
                    Mode of Transaction <span className="text-red-600">*</span>
                  </label>
                  <FinacleSelect
                    value={modeOfTxn}
                    onChange={(e) => {
                      setModeOfTxn(e.target.value);
                      if (e.target.value !== 'BY CASH') setCashStaff('');
                    }}
                    placeholder="Select Mode..."
                    options={[
                      { value: 'CDM', label: 'CDM' },
                      { value: 'BNK SLP', label: 'BNK SLP' },
                      { value: 'FINAC', label: 'FINAC' },
                      { value: 'BY CASH', label: 'BY CASH' },
                      { value: 'MOB TRF', label: 'MOB TRF' },
                      { value: 'UPI', label: 'UPI' },
                      { value: 'COR NET', label: 'COR NET' },
                    ]}
                    triggerClassName="border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase w-full"
                  />

                  {/* UTR / Reference No */}
                  <label className="font-medium text-black whitespace-nowrap">
                    UTR / Reference No
                  </label>
                  <input
                    type="text"
                    value={utrNo}
                    onChange={(e) => setUtrNo(e.target.value)}
                    placeholder="e.g. UTR / Bank Reference No"
                    className="border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase focus:outline-none focus:border-[#104080] w-full text-xs"
                  />

                  {/* Cash Staff */}
                  {modeOfTxn === 'BY CASH' && (
                    <>
                      <label className="font-medium text-black whitespace-nowrap">
                        Collection Staff <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={cashStaff}
                        onChange={(e) => setCashStaff(e.target.value)}
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
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter remarks or description..."
                    className="border border-[#c4d4ec] rounded-md p-2 bg-white focus:outline-none focus:border-[#104080] w-full text-xs"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-4">
                  <button
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="bg-[#0E498C] hover:bg-[#00A2E8] border border-[#00B5E2]/40 text-white rounded-md px-6 py-2 shadow-sm font-bold text-[13px] disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    {submitting ? 'Saving...' : editingId ? 'Update Entry' : 'Submit Entry'}
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="bg-white hover:bg-[#EBF6FC] text-[#0E498C] border border-gray-300 rounded-md px-6 py-2 shadow-sm font-bold text-[13px] cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Official Collection Receipt Preview & Download Modal */}
      <ReceivedAedReceiptModal
        record={selectedReceiptRecord}
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedReceiptRecord(null);
        }}
      />
    </div>
  );
}
