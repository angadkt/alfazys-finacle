import FinacleDatePicker from './FinacleDatePicker';
import { useState, useEffect } from 'react';
import api from '../services/api';

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
  const [dateFilter, setDateFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Entry / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [aedAmount, setAedAmount] = useState('');
  const [modeOfTxn, setModeOfTxn] = useState('');
  const [cashStaff, setCashStaff] = useState('');
  const [remainingAed, setRemainingAed] = useState('');
  const [agentCustomer, setAgentCustomer] = useState('');
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

  const fetchRecords = async (p = page, d = dateFilter, m = modeFilter) => {
    setLoading(true);
    try {
      const params: any = { page: p, limit: 50 };
      if (d) params.date = d;
      if (m) params.mode_of_txn = m;
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
    fetchRecords(1, dateFilter, modeFilter);
  }, [dateFilter, modeFilter]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setEntryDate(new Date().toISOString().slice(0, 10));
    setAedAmount('');
    setModeOfTxn('');
    setCashStaff('');
    setRemainingAed('');
    setAgentCustomer('');
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
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this Received AED entry?')) return;
    try {
      await api.delete(`/records/received-aed/${id}`);
      fetchRecords(page, dateFilter, modeFilter);
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
      };

      if (editingId) {
        await api.put(`/records/received-aed/${editingId}`, payload);
      } else {
        await api.post('/records/received-aed', payload);
      }

      setIsModalOpen(false);
      fetchRecords(page, dateFilter, modeFilter);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to save entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAedShown = records.reduce((s, r) => s + parseFloat(r.aed_amount || 0), 0);
  const totalRemainingShown = records.reduce((s, r) => s + (r.remaining_amount != null ? parseFloat(r.remaining_amount || 0) : 0), 0);

  return (
    <div className="flex-1 bg-[#d4d0c8] flex flex-col h-full overflow-hidden select-none" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Title Bar */}
      <div className="bg-[#e4e4e4] border-b border-[#a0a0a0] px-3 py-2 flex items-center justify-between shadow-xs">
        <div>
          <h4 className="text-[15px] font-extrabold text-[#1e4676] m-0 capitalize tracking-wide">
            Received AED Collection Register
          </h4>
          <span className="text-[11px] text-gray-600">
            FINCORE Universal Settlement Module • Cash & CDM Collection Journal
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="bg-[#1e4676] text-white font-bold text-[12px] px-3 py-1.5 rounded shadow hover:bg-[#15345b] flex items-center gap-1.5 cursor-pointer"
          >
            <span>+</span> Add Received AED Entry
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 bg-white border border-[#a0a0a0] m-1 flex flex-col overflow-hidden">
        {/* Navigator Action Bar */}
        <div className="flex items-center gap-3 px-3 py-1.5 bg-[#f8f9fa] border-b border-[#a0a0a0] text-[#1e4676] font-bold text-[11px]">
          <span className="cursor-pointer text-[14px] leading-none hover:text-[#0a244d]">↗</span>
          <div className="border-l-[2px] border-dotted border-[#8f8f9d] h-3"></div>
          <span 
            className="cursor-pointer hover:underline tracking-wide flex items-center gap-1"
            onClick={handleOpenAdd}
          >
            <span className="text-[#0d6e5a] text-sm">+</span> Add Received AED Entry
          </span>
          <div className="border-l-[2px] border-dotted border-[#8f8f9d] h-3"></div>
          <span 
            className="cursor-pointer hover:underline tracking-wide"
            onClick={() => fetchRecords(page, dateFilter, modeFilter)}
          >
            Refresh Register
          </span>
          <div className="border-l-[2px] border-dotted border-[#8f8f9d] h-3"></div>
          <span className="text-gray-500 font-normal">
            Total Records: <strong className="text-[#1e4676]">{total}</strong>
          </span>
        </div>

        {/* Filters Strip */}
        <div className="p-3 bg-white flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e4e4]">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Filter */}
            <div className="flex items-center gap-1.5 bg-[#f0f4f8] border border-[#c4d4ec] px-2.5 py-1 rounded">
              <span className="text-[#1e4676] font-bold text-[11px]">Date:</span>
              <FinacleDatePicker
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-white border border-[#c4d4ec] rounded px-2 py-0.5 text-xs text-gray-700 min-w-[125px] h-[26px]"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="text-gray-400 hover:text-red-500 font-bold text-xs"
                  title="Clear Date"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Mode Filter */}
            <div className="flex items-center gap-1.5 bg-[#f0f4f8] border border-[#c4d4ec] px-2.5 py-1 rounded">
              <span className="text-[#1e4676] font-bold text-[11px]">Mode:</span>
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
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
              {modeFilter && (
                <button
                  onClick={() => setModeFilter('')}
                  className="text-gray-400 hover:text-red-500 font-bold text-xs"
                  title="Clear Mode"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => fetchRecords(1, dateFilter, modeFilter)}
              className="bg-[#1e4676] text-white text-[11px] font-bold px-3 py-1 rounded hover:bg-[#15345b] cursor-pointer"
            >
              Apply Filter
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs">
            <span className="bg-[#eef2f9] border border-[#c4d4ec] px-2.5 py-1 rounded text-[#1e4676]">
              Total Collected: <strong>{totalAedShown.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED</strong>
            </span>
            <span className="bg-[#fef9ec] border border-[#fae29c] px-2.5 py-1 rounded text-[#92400e]">
              Unallocated Balance: <strong>{totalRemainingShown.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED</strong>
            </span>
          </div>
        </div>

        {/* Table Register */}
        <div className="flex-1 overflow-auto bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
              Loading Received AED records...
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <span className="text-lg font-bold text-[#1e4676] mb-1">No Received AED Records Found</span>
              <span className="text-xs text-gray-400 mb-3">Try clearing filters or add a new entry.</span>
              <button
                onClick={handleOpenAdd}
                className="bg-[#1e4676] text-white text-xs font-bold px-4 py-1.5 rounded hover:bg-[#15345b] cursor-pointer"
              >
                + Create Received AED Entry
              </button>
            </div>
          ) : (
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-[#1e4676] text-white text-left sticky top-0 z-10 shadow-xs">
                  <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">#</th>
                  <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">Entry Date</th>
                  <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">Agent / Customer</th>
                  <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">AED Amount</th>
                  <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">Mode</th>
                  <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">Cash Staff</th>
                  <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">Remaining AED</th>
                  <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">Created By</th>
                  <th className="px-3 py-2 font-semibold whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, i) => (
                  <tr
                    key={rec.id}
                    className={`border-b border-[#e4e4e4] hover:bg-[#f0f5ff] ${i % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}`}
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
                      <span className="bg-[#e8f0fb] text-[#1e4676] px-2 py-0.5 rounded font-bold text-[11px]">
                        {rec.mode_of_txn}
                      </span>
                    </td>
                    <td className="px-3 py-2 border-r border-[#e4e4e4] text-gray-700">
                      {rec.cash_staff || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-2 border-r border-[#e4e4e4] whitespace-nowrap font-bold text-[#b45309]">
                      {rec.remaining_amount != null
                        ? parseFloat(rec.remaining_amount).toLocaleString('en-AE', { minimumFractionDigits: 2 }) + ' AED'
                        : <span className="text-gray-400 font-normal">—</span>}
                    </td>
                    <td className="px-3 py-2 border-r border-[#e4e4e4] text-gray-600">
                      {rec.created_by_name || 'Admin'}
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleEdit(rec)}
                          className="text-[#1e4676] hover:underline font-bold text-[11px] cursor-pointer"
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
                <tr className="bg-[#eef2f9] font-bold text-[#1e4676] border-t-2 border-[#c4d4ec]">
                  <td className="px-3 py-2 border-r border-[#c4d4ec]" colSpan={3}>
                    Page Total ({records.length} records shown)
                  </td>
                  <td className="px-3 py-2 border-r border-[#c4d4ec] whitespace-nowrap text-[#0f5132]">
                    {totalAedShown.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                  </td>
                  <td className="px-3 py-2 border-r border-[#c4d4ec]" colSpan={2}></td>
                  <td className="px-3 py-2 border-r border-[#c4d4ec] whitespace-nowrap text-[#b45309]">
                    {totalRemainingShown.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                  </td>
                  <td className="px-3 py-2 border-r border-[#c4d4ec]" colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-2 bg-[#f8f9fa] border-t border-[#a0a0a0] flex items-center justify-between text-xs text-gray-600">
          <span>
            Showing <strong>{records.length}</strong> of <strong>{total}</strong> records
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => fetchRecords(page - 1)}
              className="bg-white border border-[#c4d4ec] px-3 py-1 rounded hover:bg-[#f0f4f8] disabled:opacity-40 disabled:cursor-not-allowed font-medium text-[#1e4676]"
            >
              Previous
            </button>
            <span className="font-bold text-[#1e4676]">
              Page {page} of {Math.max(1, Math.ceil(total / 50))}
            </span>
            <button
              disabled={page >= Math.ceil(total / 50)}
              onClick={() => fetchRecords(page + 1)}
              className="bg-white border border-[#c4d4ec] px-3 py-1 rounded hover:bg-[#f0f4f8] disabled:opacity-40 disabled:cursor-not-allowed font-medium text-[#1e4676]"
            >
              Next
            </button>
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
              <div className="bg-[#eef2f9] px-6 py-4 font-bold text-black border-b border-[#c4d4ec] text-[16px] flex items-center justify-between">
                <span>{editingId ? 'Edit Received AED Entry' : 'New Received AED Entry'}</span>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#a51a1a] font-bold hover:underline cursor-pointer text-[14px]"
                >
                  Close (X)
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 overflow-auto bg-white flex flex-col gap-6">
                <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-4 text-[13px] items-center bg-[#eaf0f8] border border-[#c4d4ec] rounded-md py-5 px-6">
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
                      className="border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase focus:outline-none focus:border-[#1e4676] w-full text-xs"
                    />
                    <datalist id="received-aed-screen-agent-list">
                      {customers.map((c) => (
                        <option key={c.id} value={`${c.name} (${c.id})`} />
                      ))}
                    </datalist>
                  </div>

                  {/* AED Amount */}
                  <label className="font-medium text-black whitespace-nowrap">
                    AED Amount Received <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={aedAmount}
                    onChange={(e) => setAedAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white focus:outline-none focus:border-[#1e4676] w-full font-bold text-gray-800"
                  />

                  {/* Mode of Transaction */}
                  <label className="font-medium text-black whitespace-nowrap">
                    Mode of Transaction <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={modeOfTxn}
                    onChange={(e) => {
                      setModeOfTxn(e.target.value);
                      if (e.target.value !== 'BY CASH') setCashStaff('');
                    }}
                    className="border border-[#c4d4ec] rounded-md h-[36px] px-2 pr-8 bg-white uppercase focus:outline-none focus:border-[#1e4676] w-full"
                  >
                    <option value="">Select Mode...</option>
                    <option value="CDM">CDM</option>
                    <option value="BNK SLP">BNK SLP</option>
                    <option value="FINAC">FINAC</option>
                    <option value="BY CASH">BY CASH</option>
                    <option value="MOB TRF">MOB TRF</option>
                    <option value="UPI">UPI</option>
                    <option value="COR NET">COR NET</option>
                  </select>

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
                        className="border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white uppercase focus:outline-none focus:border-[#1e4676] w-full"
                      />
                    </>
                  )}

                  {/* Remaining Amount AED */}
                  <label className="font-medium text-black whitespace-nowrap">Remaining Amount AED</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={remainingAed}
                    onChange={(e) => setRemainingAed(e.target.value)}
                    placeholder="0.00"
                    className="border border-[#c4d4ec] rounded-md h-[36px] px-2 bg-white focus:outline-none focus:border-[#1e4676] w-full"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-4">
                  <button
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="bg-[#1e4676] text-white rounded-md px-6 py-2 shadow-sm font-bold hover:bg-[#15345b] text-[13px] disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Saving...' : editingId ? 'Update Entry' : 'Submit Entry'}
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="bg-gray-200 text-gray-800 rounded-md px-6 py-2 shadow-sm font-medium hover:bg-gray-300 text-[13px] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
