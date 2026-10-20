import { useState, useEffect } from "react";
import FinacleDatePicker from "../FinacleDatePicker";
import api from "../../services/api";
import { 
  FileSpreadsheet, 
  FileText, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight, 
  Search, 
  Building2, 
  Wallet, 
  CreditCard, 
  Banknote, 
  Send 
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface QueueItem {
  order_id: number;
  order_no: string;
  order_date: string;
  party_id: number;
  party_name: string;
  cif_no: string;
  receiver_index: number;
  beneficiary_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch_name: string;
  servicer_name: string;
  servicer_id: number | null;
  order_amount: number;
  paid_amount: number;
  balance_due: number;
  payment_status: string;
  last_utr: string;
  paid_at: string | null;
  payout_channel: string;
  variance_amount: number;
  variance_reason: string;
}

interface Servicer {
  id: string | number;
  servicer_code: string;
  name: string;
  commission_rate: number;
  wallet: {
    bank_balance: number;
    cash_balance: number;
    total_float: number;
    reimbursements_due: number;
    accrued_commission: number;
  };
}

export default function InrDispatchDeskScreen() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [servicers, setServicers] = useState<Servicer[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    total_obligation: 0,
    total_paid: 0,
    total_uncleared: 0,
    pending_count: 0,
    paid_count: 0,
    total_beneficiaries: 0,
  });

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending_only");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Form Fields
  const [channel, setChannel] = useState<"servicer" | "direct">("servicer");
  const [selectedServicerId, setSelectedServicerId] = useState<string>("");
  const [walletType, setWalletType] = useState<"bank" | "cash">("bank");
  const [actualPaidAmount, setActualPaidAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState("bank_transfer");
  const [utrNumber, setUtrNumber] = useState("");
  const [varianceReason, setVarianceReason] = useState("");
  const [note, setNote] = useState("");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Fetch Queue & Servicers
  const fetchQueue = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      if (statusFilter !== "all") params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get("/payouts/dispatch-queue", { params });
      setQueue(res.data?.records || []);
      if (res.data?.summary) setSummary(res.data.summary);
    } catch (err) {
      console.error("Failed to load dispatch queue:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchServicers = async () => {
    try {
      const res = await api.get("/payouts/servicers");
      setServicers(res.data?.servicers || []);
    } catch (err) {
      console.error("Failed to load servicers:", err);
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchServicers();
  }, [fromDate, toDate, statusFilter]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      fetchQueue();
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Open Payout Modal
  const handleOpenPayout = (item: QueueItem) => {
    setSelectedItem(item);
    setActualPaidAmount(String(item.balance_due || item.order_amount));
    setUtrNumber("");
    setVarianceReason("");
    setNote("");
    setErrorMessage("");
    setEntryDate(new Date().toISOString().slice(0, 10));
    setChannel("servicer");

    // Pre-select servicer if already assigned, or default to first active
    if (item.servicer_id && servicers.some(s => String(s.id) === String(item.servicer_id))) {
      setSelectedServicerId(String(item.servicer_id));
    } else if (servicers.length > 0) {
      setSelectedServicerId(String(servicers[0].id));
    } else {
      setSelectedServicerId("");
    }
    setIsModalOpen(true);
  };

  // Selected Servicer helper
  const activeServicer = servicers.find(s => String(s.id) === String(selectedServicerId));

  // Calculations inside Modal
  const expectedAmt = selectedItem?.balance_due || selectedItem?.order_amount || 0;
  const actualPaidNum = parseFloat(actualPaidAmount) || 0;
  const variance = Math.round((actualPaidNum - expectedAmt) * 100) / 100;
  const isShortfall = actualPaidNum > 0 && actualPaidNum < expectedAmt;
  const isOverdeposit = actualPaidNum > expectedAmt;

  const commissionRate = channel === "servicer" && activeServicer ? activeServicer.commission_rate : 0;
  const commissionEarned = Math.round(actualPaidNum * (commissionRate / 100) * 100) / 100;

  // Submit Payout
  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (actualPaidNum <= 0) {
      setErrorMessage("Please enter a valid payout amount greater than 0");
      return;
    }
    if (!utrNumber.trim()) {
      setErrorMessage("UTR Number / Transaction Reference is mandatory");
      return;
    }
    if (channel === "servicer" && !selectedServicerId) {
      setErrorMessage("Please select a servicer to execute the dispatch");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      await api.post("/payouts/dispatch", {
        order_id: selectedItem.order_id,
        receiver_index: selectedItem.receiver_index,
        channel,
        servicer_id: channel === "servicer" ? selectedServicerId : null,
        wallet_type: channel === "direct" ? "direct" : walletType,
        actual_paid_amount: actualPaidNum,
        expected_amount: expectedAmt,
        payment_mode: paymentMode,
        utr_number: utrNumber.trim(),
        note: note.trim() || undefined,
        entry_date: entryDate,
        variance_reason: varianceReason.trim() || undefined,
      });

      setIsModalOpen(false);
      fetchQueue();
      fetchServicers();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || "Failed to process payout dispatch");
    } finally {
      setSubmitting(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    const data = queue.map((r) => ({
      "Order No": r.order_no,
      "Order Date": r.order_date,
      "Agent / CIF": `${r.party_name} (${r.cif_no})`,
      "Beneficiary Name": r.beneficiary_name,
      "Bank Name": r.bank_name,
      "Account Number": r.account_number,
      "IFSC Code": r.ifsc_code,
      "Branch": r.branch_name,
      "Booked INR": r.order_amount,
      "Paid INR": r.paid_amount,
      "Balance Due": r.balance_due,
      "Status": r.payment_status,
      "Servicer": r.servicer_name || (r.payout_channel === "direct" ? "Direct" : "-"),
      "UTR / Ref": r.last_utr || "-",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dispatch Queue");
    XLSX.writeFile(wb, `INR_Dispatch_Queue_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Export to PDF
  const exportToPdf = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(14);
    doc.text("INR Remittance Dispatch & Beneficiary Payout Desk", 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()} | Obligation: INR ${summary.total_obligation.toLocaleString()} | Paid: INR ${summary.total_paid.toLocaleString()}`, 14, 22);

    autoTable(doc, {
      startY: 26,
      head: [["Order#", "Date", "Agent", "Beneficiary", "Bank & A/C", "IFSC", "Amount (INR)", "Paid (INR)", "Due (INR)", "Status", "Servicer"]],
      body: queue.map((r) => [
        r.order_no,
        r.order_date,
        `${r.party_name} (${r.cif_no})`,
        r.beneficiary_name,
        `${r.bank_name} ${r.account_number}`,
        r.ifsc_code,
        r.order_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
        r.paid_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
        r.balance_due.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
        r.payment_status,
        r.servicer_name || (r.payout_channel === "direct" ? "Direct" : "-"),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 64, 128] },
    });

    doc.save(`INR_Dispatch_Queue_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden text-xs">
      {/* Finacle Top Command Header */}
      <div className="bg-[#104080] text-white px-3 py-1.5 flex items-center justify-between border-b border-[#0a2850] shadow-xs select-none">
        <div className="flex items-center gap-2">
          <span className="text-sm">📁</span>
          <span className="font-bold tracking-wider text-xs">FINCORE UNIVERSAL SETTLEMENT — INR BENEFICIARY PAYOUT DESK</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1 bg-[#23528f] hover:bg-[#1a4073] text-white px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
            title="Export Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Excel
          </button>
          <button
            onClick={exportToPdf}
            className="flex items-center gap-1 bg-[#23528f] hover:bg-[#1a4073] text-white px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
            title="Export PDF"
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" /> PDF
          </button>
          <button
            onClick={() => { fetchQueue(); fetchServicers(); }}
            className="flex items-center gap-1 bg-[#23528f] hover:bg-[#1a4073] text-white px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-[#f0f4f8] border-b border-[#c4d4ec] px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date Pills */}
          <div className="flex items-center gap-1 bg-white border border-[#c4d4ec] rounded p-0.5">
            <button
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                setFromDate(today);
                setToDate(today);
              }}
              className="px-2 py-0.5 text-[11px] font-bold hover:bg-[#e6edf8] text-[#1e4676] rounded cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                const yest = d.toISOString().slice(0, 10);
                setFromDate(yest);
                setToDate(yest);
              }}
              className="px-2 py-0.5 text-[11px] font-bold hover:bg-[#e6edf8] text-[#1e4676] rounded cursor-pointer"
            >
              Yesterday
            </button>
            <button
              onClick={() => { setFromDate(""); setToDate(""); }}
              className="px-2 py-0.5 text-[11px] font-bold hover:bg-[#e6edf8] text-[#1e4676] rounded cursor-pointer"
            >
              All Time
            </button>
          </div>

          {/* Date Pickers */}
          <div className="flex items-center gap-1.5 bg-white border border-[#c4d4ec] px-2 py-1 rounded">
            <span className="text-gray-500 text-[10px] font-semibold">From:</span>
            <FinacleDatePicker value={fromDate} onChange={setFromDate} />
            <span className="text-gray-500 text-[10px] font-semibold">To:</span>
            <FinacleDatePicker value={toDate} onChange={setToDate} />
            {(fromDate || toDate) && (
              <button
                onClick={() => { setFromDate(""); setToDate(""); }}
                className="text-gray-400 hover:text-red-500 font-bold ml-1 text-xs"
                title="Clear Dates"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-[#c4d4ec] px-2 py-1 rounded">
            <span className="text-[#1e4676] font-bold text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-gray-800 focus:outline-none cursor-pointer"
            >
              <option value="pending_only">Pending & Partial Only</option>
              <option value="all">All Payout Statuses</option>
              <option value="partial">Partial Only (Shortfall)</option>
              <option value="paid">Fully Settled / Paid</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Beneficiary, A/C, IFSC, Agent..."
            className="bg-white border border-[#c4d4ec] rounded px-2.5 py-1 text-xs text-gray-700 w-[240px] pl-7 focus:outline-none focus:border-[#104080]"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1 text-gray-400 hover:text-red-500 font-bold text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 p-3 bg-[#eef3f9] border-b border-[#c4d4ec]">
        <div className="bg-white border border-[#c4d4ec] rounded-xs p-2.5 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total INR Obligation</div>
          <div className="text-base font-extrabold text-[#104080] mt-0.5">
            ₹ {summary.total_obligation.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">{summary.total_beneficiaries} Total Beneficiaries</div>
        </div>

        <div className="bg-white border border-[#c4d4ec] rounded-xs p-2.5 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Transferred / Paid</div>
          <div className="text-base font-extrabold text-emerald-600 mt-0.5">
            ₹ {summary.total_paid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">{summary.paid_count} Beneficiaries Settled</div>
        </div>

        <div className="bg-white border border-[#c4d4ec] rounded-xs p-2.5 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Uncleared / Remaining</div>
          <div className="text-base font-extrabold text-rose-600 mt-0.5">
            ₹ {summary.total_uncleared.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">{summary.pending_count} Awaiting Payout</div>
        </div>

        <div className="bg-white border border-[#c4d4ec] rounded-xs p-2.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Fulfillment Ratio</span>
            <span className="text-xs font-bold text-[#104080]">
              {summary.total_obligation > 0 ? Math.round((summary.total_paid / summary.total_obligation) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-[#104080] h-full transition-all duration-300"
              style={{ width: `${summary.total_obligation > 0 ? Math.min(100, (summary.total_paid / summary.total_obligation) * 100) : 0}%` }}
            />
          </div>
          <div className="text-[10px] text-gray-500 mt-1 flex justify-between">
            <span>{summary.pending_count} Pending</span>
            <span>{summary.paid_count} Completed</span>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="flex-1 overflow-auto custom-scrollbar p-3">
        <div className="border border-[#c4d4ec] rounded-xs overflow-hidden shadow-2xs bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#e4e4e4] border-b border-[#a0a0a0] text-[11px] font-bold text-[#104080] uppercase tracking-wider select-none">
                <th className="py-2 px-2.5 border-r border-[#c4d4ec]">Order Details</th>
                <th className="py-2 px-2.5 border-r border-[#c4d4ec]">Agent / CIF</th>
                <th className="py-2 px-2.5 border-r border-[#c4d4ec]">Beneficiary & Account</th>
                <th className="py-2 px-2.5 border-r border-[#c4d4ec] text-right">Booked (INR)</th>
                <th className="py-2 px-2.5 border-r border-[#c4d4ec] text-right">Paid (INR)</th>
                <th className="py-2 px-2.5 border-r border-[#c4d4ec] text-right">Balance Due</th>
                <th className="py-2 px-2.5 border-r border-[#c4d4ec] text-center">Status</th>
                <th className="py-2 px-2.5 border-r border-[#c4d4ec]">Servicer / UTR</th>
                <th className="py-2 px-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] text-[12px]">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    No beneficiary payout records match the current filter.
                  </td>
                </tr>
              ) : (
                queue.map((item, idx) => {
                  const isSettled = item.payment_status.toLowerCase() === "paid";
                  const isPartial = item.payment_status.toLowerCase() === "partial";

                  return (
                    <tr
                      key={`${item.order_id}-${item.receiver_index}-${idx}`}
                      className="hover:bg-[#f6f9fc] transition-colors"
                    >
                      {/* Order Details */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0]">
                        <div className="font-extrabold text-[#104080]">{item.order_no}</div>
                        <div className="text-[10px] text-gray-500">{item.order_date}</div>
                      </td>

                      {/* Agent */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0]">
                        <div className="font-bold text-gray-800">{item.party_name}</div>
                        <div className="text-[10px] text-gray-500">{item.cif_no}</div>
                      </td>

                      {/* Beneficiary */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0]">
                        <div className="font-extrabold text-gray-900">{item.beneficiary_name}</div>
                        <div className="text-gray-600 font-mono text-[11px]">
                          {item.bank_name} • A/C {item.account_number}
                        </div>
                        <div className="text-[10px] text-gray-400">IFSC: {item.ifsc_code} {item.branch_name ? `• ${item.branch_name}` : ""}</div>
                      </td>

                      {/* Booked INR */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0] text-right font-bold text-gray-800">
                        ₹ {item.order_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Paid INR */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0] text-right font-bold text-emerald-700">
                        ₹ {item.paid_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        {item.variance_amount > 0 && (
                          <div className="text-[9px] text-blue-600 font-bold">
                            (+₹{item.variance_amount} pocket top-up)
                          </div>
                        )}
                      </td>

                      {/* Balance Due */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0] text-right font-extrabold text-rose-700">
                        ₹ {item.balance_due.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0] text-center">
                        {isSettled ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-extrabold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PAID
                          </span>
                        ) : isPartial ? (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-extrabold">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> PARTIAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded text-[10px] font-extrabold">
                            <Clock className="w-3 h-3 text-rose-600" /> AWAITING
                          </span>
                        )}
                      </td>

                      {/* Servicer / UTR */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0]">
                        <div className="font-bold text-gray-800">
                          {item.servicer_name || (item.payout_channel === "direct" ? "Direct Payout" : "Unassigned")}
                        </div>
                        {item.last_utr ? (
                          <div className="text-[10px] font-mono text-gray-600 truncate max-w-[140px]" title={item.last_utr}>
                            UTR: {item.last_utr}
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-400">No UTR logged</div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-2 px-2.5 text-center">
                        {!isSettled ? (
                          <button
                            onClick={() => handleOpenPayout(item)}
                            className="bg-[#104080] hover:bg-[#1a5299] text-white font-bold px-3 py-1 rounded text-xs flex items-center gap-1 mx-auto shadow-xs transition-colors cursor-pointer"
                          >
                            <Send className="w-3 h-3" /> Dispatch
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenPayout(item)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-2.5 py-0.5 rounded text-[11px] border border-gray-300 mx-auto"
                          >
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Debit Entry Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#104080] shadow-2xl rounded-xs w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#104080] text-white px-3 py-2 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <span className="text-sm">⚡</span>
                <span className="font-bold text-xs uppercase tracking-wider">
                  Beneficiary Payout & Debit Entry — {selectedItem.order_no}
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-red-300 font-bold text-sm px-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitPayout} className="p-4 space-y-3.5 max-h-[85vh] overflow-y-auto">
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-300 text-rose-700 px-3 py-1.5 rounded text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Beneficiary Information Card */}
              <div className="bg-[#f0f4f8] border border-[#c4d4ec] p-2.5 rounded-xs">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Beneficiary Account Details (India)
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Beneficiary:</span>{" "}
                    <strong className="text-gray-900">{selectedItem.beneficiary_name}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Order Obligation:</span>{" "}
                    <strong className="text-[#104080]">₹ {selectedItem.order_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Bank & IFSC:</span>{" "}
                    <strong className="text-gray-800">{selectedItem.bank_name} ({selectedItem.ifsc_code})</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Account Number:</span>{" "}
                    <strong className="text-gray-900 font-mono">{selectedItem.account_number}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Already Paid:</span>{" "}
                    <strong className="text-emerald-700">₹ {selectedItem.paid_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Remaining Due:</span>{" "}
                    <strong className="text-rose-700">₹ {selectedItem.balance_due.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>
              </div>

              {/* Channel Selector */}
              <div className="border border-[#c4d4ec] p-2.5 rounded-xs space-y-2">
                <div className="text-[11px] font-bold text-[#104080] uppercase tracking-wider">
                  Dispatch Channel:
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-gray-800">
                    <input
                      type="radio"
                      name="channel"
                      value="servicer"
                      checked={channel === "servicer"}
                      onChange={() => setChannel("servicer")}
                      className="accent-[#104080]"
                    />
                    Via Servicer (Commissioned Partner)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-gray-800">
                    <input
                      type="radio"
                      name="channel"
                      value="direct"
                      checked={channel === "direct"}
                      onChange={() => setChannel("direct")}
                      className="accent-[#104080]"
                    />
                    Direct Company Payout (No Servicer)
                  </label>
                </div>

                {/* Servicer Options */}
                {channel === "servicer" ? (
                  <div className="mt-2 pt-2 border-t border-[#e2e8f0] grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                        Select Servicer:
                      </label>
                      <select
                        value={selectedServicerId}
                        onChange={(e) => setSelectedServicerId(e.target.value)}
                        className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#104080]"
                      >
                        {servicers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.servicer_code}) — {s.commission_rate}% Comm
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                        Deduct From Servicer Wallet:
                      </label>
                      <div className="flex items-center gap-3 mt-1">
                        <label className="flex items-center gap-1 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name="walletType"
                            value="bank"
                            checked={walletType === "bank"}
                            onChange={() => setWalletType("bank")}
                            className="accent-[#104080]"
                          />
                          <span>Bank Wallet (₹ {activeServicer?.wallet.bank_balance.toLocaleString("en-IN") || 0})</span>
                        </label>
                        <label className="flex items-center gap-1 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name="walletType"
                            value="cash"
                            checked={walletType === "cash"}
                            onChange={() => setWalletType("cash")}
                            className="accent-[#104080]"
                          />
                          <span>Cash Wallet (₹ {activeServicer?.wallet.cash_balance.toLocaleString("en-IN") || 0})</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 pt-2 border-t border-[#e2e8f0] text-xs text-gray-600">
                    <p className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded">
                      ℹ️ Direct Settlement: 0% servicer commission deduction. Company retains 100% of profit yield.
                    </p>
                  </div>
                )}
              </div>

              {/* Actual Paid Amount & Variance Section */}
              <div className="border border-[#c4d4ec] p-2.5 rounded-xs space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                      Actual Paid Amount (INR):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={actualPaidAmount}
                      onChange={(e) => setActualPaidAmount(e.target.value)}
                      placeholder="Enter actual deposited amount"
                      className="w-full border-2 border-[#104080] rounded px-2.5 py-1 text-sm font-extrabold text-gray-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                      Entry Date:
                    </label>
                    <FinacleDatePicker value={entryDate} onChange={setEntryDate} />
                  </div>
                </div>

                {/* Variance Notices (Case 1 Shortfall vs Case 2 Overdeposit) */}
                {isShortfall && (
                  <div className="bg-amber-50 border border-amber-300 p-2.5 rounded text-xs space-y-1">
                    <div className="font-extrabold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Case 1 Shortfall Detected: -₹ {Math.abs(variance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-amber-800 text-[11px]">
                      The actual paid amount is less than the due amount. The beneficiary will be marked <strong>PARTIAL</strong>, and the remaining ₹ {Math.abs(variance)} stays in the dispatch queue.
                    </p>
                    <div className="mt-1">
                      <span className="text-gray-600 font-semibold text-[10px]">Reason:</span>{" "}
                      <select
                        value={varianceReason}
                        onChange={(e) => setVarianceReason(e.target.value)}
                        className="bg-white border border-amber-300 rounded px-1.5 py-0.5 text-xs text-gray-700 ml-1"
                      >
                        <option value="Beneficiary Daily/Txn Limit Reached">Beneficiary Daily/Txn Limit Reached</option>
                        <option value="KYC Threshold Restriction">KYC Threshold Restriction</option>
                        <option value="Partial Cash Available">Partial Cash Available</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                )}

                {isOverdeposit && (
                  <div className="bg-blue-50 border border-blue-300 p-2.5 rounded text-xs space-y-1">
                    <div className="font-extrabold text-blue-900 flex items-center gap-1.5">
                      <ArrowUpRight className="w-4 h-4 text-blue-600" />
                      Case 2 CDM Pocket Top-up: +₹ {variance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-blue-800 text-[11px]">
                      The servicer paid an extra ₹ {variance} from their own hand (e.g. CDM note denomination). The order is 100% PAID, and +₹ {variance} will be credited as <strong>Reimbursable Out-of-Pocket Cash</strong>.
                    </p>
                    <div className="mt-1">
                      <span className="text-gray-600 font-semibold text-[10px]">Reason:</span>{" "}
                      <select
                        value={varianceReason}
                        onChange={(e) => setVarianceReason(e.target.value)}
                        className="bg-white border border-blue-300 rounded px-1.5 py-0.5 text-xs text-gray-700 ml-1"
                      >
                        <option value="CDM Note Denomination (Added from pocket)">CDM Note Denomination (Added from pocket)</option>
                        <option value="CDM Machine Minimum Threshold">CDM Machine Minimum Threshold</option>
                        <option value="Rounding Convenience">Rounding Convenience</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                )}

                {channel === "servicer" && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 font-bold text-gray-700">
                    <span>Servicer Commission ({commissionRate}%):</span>
                    <span className="text-emerald-700">₹ {commissionEarned.toLocaleString("en-IN", { minimumFractionDigits: 2 })} (Accrues in Wallet)</span>
                  </div>
                )}
              </div>

              {/* Payment Mode & UTR */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                    Payment Mode:
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#104080]"
                  >
                    <option value="bank_transfer">Bank IMPS / NEFT / RTGS</option>
                    <option value="cdm">CDM Cash Deposit Machine</option>
                    <option value="upi">UPI / QR Transfer</option>
                    <option value="cash">Direct Cash Handover</option>
                    <option value="cheque">Cheque Deposit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                    UTR / RRN Reference <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="Enter unique bank UTR"
                    className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs uppercase font-mono focus:outline-none focus:border-[#104080]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                  Staff Remarks (Optional):
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional internal remarks..."
                  className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#104080]"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-[#d4d0c8] hover:bg-[#e4e4e4] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] px-4 py-1 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#104080] hover:bg-[#1a559e] text-white px-5 py-1 text-xs font-bold rounded shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {submitting ? "Processing..." : "Confirm & Dispatch Payout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
