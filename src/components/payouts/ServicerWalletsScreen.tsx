import { useState, useEffect } from "react";
import FinacleDatePicker from "../FinacleDatePicker";
import api from "../../services/api";
import { 
  Building2, 
  Wallet, 
  CreditCard, 
  Banknote, 
  Plus, 
  ArrowLeftRight, 
  Award, 
  RefreshCw, 
  FileSpreadsheet, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowDownLeft, 
  ArrowUpRight,
  RotateCcw
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Servicer {
  id: string | number;
  servicer_code: string;
  name: string;
  phone: string;
  city: string;
  bank_name: string;
  account_no: string;
  ifsc_code: string;
  commission_rate: number;
  status: string;
  created_at: string;
  wallet: {
    bank_balance: number;
    cash_balance: number;
    total_float: number;
    reimbursements_due: number;
    accrued_commission: number;
    settled_commission: number;
    total_payouts_count: number;
    total_payouts_amount: number;
  };
}

interface StatementTxn {
  id: number;
  txn_no: string;
  servicer_id: number;
  channel: string;
  txn_type: string;
  direction: string;
  wallet_type: string;
  amount: number;
  order_id: number | null;
  order_no: string | null;
  beneficiary_name: string | null;
  beneficiary_account: string | null;
  beneficiary_bank: string | null;
  variance_amount: number;
  variance_reason: string | null;
  commission_rate: number;
  commission_amount: number;
  commission_settled: boolean;
  payment_mode: string;
  utr_number: string | null;
  note: string | null;
  entry_date: string;
  created_at: string;
  created_by_name: string;
  bounced: boolean;
  bounced_reason: string | null;
}

export default function ServicerWalletsScreen() {
  const [servicers, setServicers] = useState<Servicer[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [statement, setStatement] = useState<StatementTxn[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStatement, setLoadingStatement] = useState(false);

  // Modals
  const [isAddServicerOpen, setIsAddServicerOpen] = useState(false);
  const [isAddCreditOpen, setIsAddCreditOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [isBounceOpen, setIsBounceOpen] = useState(false);
  const [bounceTxn, setBounceTxn] = useState<StatementTxn | null>(null);

  // Form States
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // New Servicer Form
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newBankName, setNewBankName] = useState("");
  const [newAccountNo, setNewAccountNo] = useState("");
  const [newIfsc, setNewIfsc] = useState("");
  const [newCommissionRate, setNewCommissionRate] = useState("0.25");

  // Add Float Credit Form
  const [creditAmount, setCreditAmount] = useState("");
  const [creditWallet, setCreditWallet] = useState<"bank" | "cash">("bank");
  const [creditMode, setCreditMode] = useState("bank_transfer");
  const [creditUtr, setCreditUtr] = useState("");
  const [creditNote, setCreditNote] = useState("");
  const [creditDate, setCreditDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Convert Float Form
  const [convertAmount, setConvertAmount] = useState("");
  const [convertFrom, setConvertFrom] = useState<"bank" | "cash">("bank");
  const [convertTo, setConvertTo] = useState<"bank" | "cash">("cash");
  const [convertNote, setConvertNote] = useState("");
  const [convertDate, setConvertDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Bounce Form
  const [bounceReason, setBounceReason] = useState("Bank rejection / invalid account");

  // Load Servicers
  const fetchServicers = async (keepId?: string) => {
    setLoading(true);
    try {
      const res = await api.get("/payouts/servicers");
      const list: Servicer[] = res.data?.servicers || [];
      setServicers(list);

      if (list.length > 0) {
        const idToSelect = keepId || selectedId || String(list[0].id);
        setSelectedId(idToSelect);
      }
    } catch (err) {
      console.error("Failed to fetch servicers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load Statement for Selected Servicer
  const fetchStatement = async (id: string) => {
    if (!id) return;
    setLoadingStatement(true);
    try {
      const res = await api.get(`/payouts/servicers/${id}/statement`);
      setStatement(res.data?.transactions || []);
    } catch (err) {
      console.error("Failed to load statement:", err);
    } finally {
      setLoadingStatement(false);
    }
  };

  useEffect(() => {
    fetchServicers();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchStatement(selectedId);
    }
  }, [selectedId]);

  const activeServicer = servicers.find(s => String(s.id) === String(selectedId));

  // Handle Create Servicer
  const handleCreateServicer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { setModalError("Name is required"); return; }
    setSubmitting(true);
    setModalError("");
    try {
      const res = await api.post("/payouts/servicers", {
        name: newName.trim(),
        phone: newPhone.trim() || undefined,
        city: newCity.trim() || undefined,
        bank_name: newBankName.trim() || undefined,
        account_no: newAccountNo.trim() || undefined,
        ifsc_code: newIfsc.trim().toUpperCase() || undefined,
        commission_rate: parseFloat(newCommissionRate) || 0.25,
      });
      setIsAddServicerOpen(false);
      setNewName(""); setNewPhone(""); setNewCity(""); setNewBankName(""); setNewAccountNo(""); setNewIfsc("");
      await fetchServicers(String(res.data?.servicer?.id));
    } catch (err: any) {
      setModalError(err.response?.data?.error || err.message || "Failed to create servicer");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Add Float Credit
  const handleAddCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(creditAmount);
    if (!amt || amt <= 0) { setModalError("Please enter a valid credit amount"); return; }
    setSubmitting(true);
    setModalError("");
    try {
      await api.post(`/payouts/servicers/${selectedId}/credit`, {
        amount: amt,
        wallet_type: creditWallet,
        payment_mode: creditMode,
        utr_number: creditUtr.trim() || undefined,
        note: creditNote.trim() || undefined,
        entry_date: creditDate,
      });
      setIsAddCreditOpen(false);
      setCreditAmount(""); setCreditUtr(""); setCreditNote("");
      await fetchServicers(selectedId);
      await fetchStatement(selectedId);
    } catch (err: any) {
      setModalError(err.response?.data?.error || err.message || "Failed to add float credit");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Float Conversion
  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(convertAmount);
    if (!amt || amt <= 0) { setModalError("Please enter a valid conversion amount"); return; }
    if (convertFrom === convertTo) { setModalError("Source and target wallets must be different"); return; }
    setSubmitting(true);
    setModalError("");
    try {
      await api.post(`/payouts/servicers/${selectedId}/convert`, {
        amount: amt,
        from_wallet: convertFrom,
        to_wallet: convertTo,
        note: convertNote.trim() || undefined,
        entry_date: convertDate,
      });
      setIsConvertOpen(false);
      setConvertAmount(""); setConvertNote("");
      await fetchServicers(selectedId);
      await fetchStatement(selectedId);
    } catch (err: any) {
      setModalError(err.response?.data?.error || err.message || "Failed to convert float");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Settle Commission
  const handleSettleCommission = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await api.post(`/payouts/servicers/${selectedId}/settle-commission`);
      setIsSettleOpen(false);
      await fetchServicers(selectedId);
      await fetchStatement(selectedId);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to settle commission");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Bounce
  const handleConfirmBounce = async () => {
    if (!bounceTxn) return;
    setSubmitting(true);
    try {
      await api.post(`/payouts/transactions/${bounceTxn.id}/bounce`, {
        reason: bounceReason.trim() || undefined,
      });
      setIsBounceOpen(false);
      setBounceTxn(null);
      await fetchServicers(selectedId);
      await fetchStatement(selectedId);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to bounce transaction");
    } finally {
      setSubmitting(false);
    }
  };

  // Export Statement
  const exportStatementExcel = () => {
    if (!activeServicer) return;
    const data = statement.map((t) => ({
      "Txn No": t.txn_no,
      "Date": t.entry_date,
      "Type": t.txn_type,
      "Direction": t.direction,
      "Wallet": t.wallet_type,
      "Amount (INR)": t.amount,
      "Order No": t.order_no || "-",
      "Beneficiary": t.beneficiary_name || "-",
      "Bank / Mode": t.payment_mode,
      "UTR / Ref": t.utr_number || "-",
      "Commission": t.commission_amount || 0,
      "Commission Settled": t.commission_settled ? "Yes" : "No",
      "Bounced": t.bounced ? "Yes" : "No",
      "Notes": t.note || "-",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Statement");
    XLSX.writeFile(wb, `Servicer_${activeServicer.servicer_code}_Statement_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden text-xs">
      {/* Finacle Command Header */}
      <div className="bg-[#104080] text-white px-3 py-1.5 flex items-center justify-between border-b border-[#0a2850] shadow-xs select-none">
        <div className="flex items-center gap-2">
          <span className="text-sm">📁</span>
          <span className="font-bold tracking-wider text-xs">FINCORE SERVICER ACCOUNTS & DIGITAL WALLETS</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setModalError(""); setIsAddServicerOpen(true); }}
            className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Servicer Account
          </button>
          <button
            onClick={() => { fetchServicers(selectedId); if (selectedId) fetchStatement(selectedId); }}
            className="flex items-center gap-1 bg-[#23528f] hover:bg-[#1a4073] text-white px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Servicer Selector Bar */}
      <div className="bg-[#f0f4f8] border-b border-[#c4d4ec] px-3 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[#104080] font-extrabold text-[12px] flex items-center gap-1">
            <Building2 className="w-4 h-4" /> Servicer Profile:
          </span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-white border-2 border-[#104080] rounded px-2.5 py-1 text-xs font-bold text-gray-900 focus:outline-none min-w-[240px] cursor-pointer"
          >
            {servicers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.servicer_code}) — {s.commission_rate}% Comm
              </option>
            ))}
          </select>
          {activeServicer && (
            <span className="text-[11px] text-gray-600 bg-white border border-[#c4d4ec] px-2 py-0.5 rounded">
              📍 {activeServicer.city || "Headquarters"} • 📞 {activeServicer.phone || "No phone"} • 🏦 {activeServicer.bank_name || "Bank not set"}
            </span>
          )}
        </div>

        {/* Action Buttons for Selected Servicer */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setModalError(""); setIsAddCreditOpen(true); }}
            className="flex items-center gap-1 bg-[#104080] hover:bg-[#1a559e] text-white px-3 py-1 rounded text-xs font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Float (Credit)
          </button>
          <button
            onClick={() => { setModalError(""); setIsConvertOpen(true); }}
            className="flex items-center gap-1 bg-white hover:bg-gray-100 border border-[#c4d4ec] text-[#104080] px-3 py-1 rounded text-xs font-bold shadow-2xs cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" /> ATM Cash Conversion
          </button>
          <button
            onClick={() => setIsSettleOpen(true)}
            className="flex items-center gap-1 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded text-xs font-bold shadow-xs cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" /> Settle Commission
          </button>
        </div>
      </div>

      {/* Multi-Bucket Wallet Cards */}
      {activeServicer && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 p-3 bg-[#eef3f9] border-b border-[#c4d4ec]">
          {/* Card 1: Bank Wallet */}
          <div className="bg-white border-2 border-[#104080] rounded-xs p-2.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-[#104080]" /> Bank Wallet Balance
              </span>
              <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">IMPS/RTGS</span>
            </div>
            <div className="text-lg font-extrabold text-[#104080] mt-1">
              ₹ {activeServicer.wallet.bank_balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">Available for Bank Dispatches</div>
          </div>

          {/* Card 2: Cash Wallet */}
          <div className="bg-white border-2 border-emerald-700 rounded-xs p-2.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-emerald-700" /> Cash / Hand Balance
              </span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">CDM/Cash</span>
            </div>
            <div className="text-lg font-extrabold text-emerald-700 mt-1">
              ₹ {activeServicer.wallet.cash_balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">Physical Cash in Hand for CDM</div>
          </div>

          {/* Card 3: Reimbursable Out-of-Pocket Top-up */}
          <div className="bg-white border border-[#c4d4ec] rounded-xs p-2.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5 text-blue-600" /> Pocket Reimbursable
              </span>
              <span className="text-[9px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.2 rounded">Case 2 Top-ups</span>
            </div>
            <div className="text-lg font-extrabold text-blue-600 mt-1">
              ₹ {activeServicer.wallet.reimbursements_due.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">CDM Denomination Pocket Advances</div>
          </div>

          {/* Card 4: Accrued Commission (Option 2) */}
          <div className="bg-white border-2 border-amber-500 rounded-xs p-2.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-600" /> Accrued Commission
              </span>
              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">Unpaid Earnings</span>
            </div>
            <div className="text-lg font-extrabold text-amber-600 mt-1">
              ₹ {activeServicer.wallet.accrued_commission.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5 flex justify-between">
              <span>Rate: {activeServicer.commission_rate}%</span>
              <span>Paid: ₹ {activeServicer.wallet.settled_commission.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      )}

      {/* Statement / Passbook Ledger Header */}
      <div className="bg-[#e4e4e4] px-3 py-1.5 border-b border-[#a0a0a0] flex items-center justify-between text-[11px] font-bold text-[#104080]">
        <span>WALLET PASSBOOK & TRANSACTION STATEMENT</span>
        <button
          onClick={exportStatementExcel}
          className="flex items-center gap-1 text-[#104080] hover:text-[#0c3162] cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export Statement
        </button>
      </div>

      {/* Statement Table */}
      <div className="flex-1 overflow-auto custom-scrollbar p-3">
        <div className="border border-[#c4d4ec] rounded-xs overflow-hidden shadow-2xs bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f0f4f8] border-b border-[#c4d4ec] text-[10px] font-extrabold text-[#104080] uppercase tracking-wider select-none">
                <th className="py-2 px-2.5 border-r border-[#c4d4ec]">Txn# & Date</th>
                <th className="py-2 px-2.5 border-r border-[#c4d4ec]">Type</th>
                <th className="py-2 px-2.5 border-r border-[#c4d4ec]">Wallet</th>
                <th className="py-2 px-2.5 border-r border-[#c4d4ec]">Details / Beneficiary</th>
                <th className="py-2 px-2.5 border-r border-[#c4d4ec] text-right">Inward (+)</th>
                <th className="py-2 px-2.5 border-r border-[#c4d4ec] text-right">Payout Out (-)</th>
                <th className="py-2 px-2.5 border-r border-[#c4d4ec] text-right">Commission</th>
                <th className="py-2 px-2.5 border-r border-[#c4d4ec]">UTR / Ref</th>
                <th className="py-2 px-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] text-[12px]">
              {statement.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-gray-500">
                    No transactions recorded for this servicer yet. Use <strong>[ Add Float (Credit) ]</strong> above to allocate initial float.
                  </td>
                </tr>
              ) : (
                statement.map((t) => {
                  const isIn = t.direction === "in";
                  const isDebit = t.txn_type === "payout_debit";

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-[#f6f9fc] transition-colors ${t.bounced ? "bg-red-50/50" : ""}`}
                    >
                      {/* Txn Details */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0]">
                        <div className="font-mono font-bold text-[#104080]">{t.txn_no}</div>
                        <div className="text-[10px] text-gray-500">{t.entry_date}</div>
                      </td>

                      {/* Type */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0]">
                        {t.txn_type === "float_credit" && (
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[10px]">FLOAT TOP-UP</span>
                        )}
                        {t.txn_type === "payout_debit" && (
                          <span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded text-[10px]">PAYOUT DEBIT</span>
                        )}
                        {t.txn_type === "conversion" && (
                          <span className="bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded text-[10px]">ATM CONVERT</span>
                        )}
                        {t.txn_type === "reimbursement" && (
                          <span className="bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded text-[10px]">POCKET REIMB</span>
                        )}
                        {t.txn_type === "commission_settle" && (
                          <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded text-[10px]">COMMISSION PAID</span>
                        )}
                        {t.bounced && (
                          <span className="bg-rose-600 text-white font-extrabold px-1.5 py-0.5 rounded text-[9px] ml-1">BOUNCED</span>
                        )}
                      </td>

                      {/* Wallet */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0] font-bold text-gray-700 capitalize">
                        {t.wallet_type === "bank" ? "💳 Bank" : t.wallet_type === "cash" ? "💵 Cash" : "Direct"}
                      </td>

                      {/* Details / Beneficiary */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0]">
                        {t.beneficiary_name ? (
                          <div>
                            <strong className="text-gray-900">{t.beneficiary_name}</strong>
                            {t.order_no && <span className="text-[10px] text-gray-500 ml-1">({t.order_no})</span>}
                            <div className="text-[10px] text-gray-500 font-mono">{t.beneficiary_bank} • {t.beneficiary_account}</div>
                          </div>
                        ) : (
                          <div className="text-gray-700">{t.note || "-"}</div>
                        )}
                      </td>

                      {/* Inward */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0] text-right font-bold text-emerald-600">
                        {isIn ? `+₹ ${t.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
                      </td>

                      {/* Outward */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0] text-right font-bold text-rose-600">
                        {!isIn ? `-₹ ${t.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
                      </td>

                      {/* Commission */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0] text-right font-bold text-amber-600">
                        {t.commission_amount > 0 ? (
                          <div>
                            +₹ {t.commission_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            <div className="text-[9px] font-normal text-gray-500">
                              {t.commission_settled ? "✓ Settled" : "⏳ Unpaid"}
                            </div>
                          </div>
                        ) : "—"}
                      </td>

                      {/* UTR */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0] font-mono text-[11px] text-gray-700">
                        {t.utr_number || "—"}
                      </td>

                      {/* Action */}
                      <td className="py-2 px-2.5 text-center">
                        {isDebit && !t.bounced && (
                          <button
                            onClick={() => { setBounceTxn(t); setIsBounceOpen(true); }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-semibold px-2 py-0.5 rounded text-[10px] cursor-pointer"
                            title="Mark as Bank Bounce / Return"
                          >
                            Bounce
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

      {/* MODAL 1: Create Servicer Account */}
      {isAddServicerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#104080] shadow-2xl rounded-xs w-full max-w-lg overflow-hidden">
            <div className="bg-[#104080] text-white px-3 py-2 flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider">Create New Servicer Account</span>
              <button onClick={() => setIsAddServicerOpen(false)} className="text-white hover:text-red-300 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateServicer} className="p-4 space-y-3">
              {modalError && (
                <div className="bg-rose-50 border border-rose-300 text-rose-700 px-3 py-1.5 rounded text-xs">
                  {modalError}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Servicer Full Name <span className="text-red-500">*</span>:</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#104080]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Phone / WhatsApp:</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+91 ..."
                    className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">City / Location:</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Bank Name:</label>
                  <input
                    type="text"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    placeholder="HDFC Bank"
                    className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Account Number:</label>
                  <input
                    type="text"
                    value={newAccountNo}
                    onChange={(e) => setNewAccountNo(e.target.value)}
                    placeholder="50100..."
                    className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">IFSC Code:</label>
                  <input
                    type="text"
                    value={newIfsc}
                    onChange={(e) => setNewIfsc(e.target.value)}
                    placeholder="HDFC0001"
                    className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none uppercase font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Default Commission Rate (%):</label>
                <input
                  type="number"
                  step="0.01"
                  value={newCommissionRate}
                  onChange={(e) => setNewCommissionRate(e.target.value)}
                  placeholder="0.25"
                  className="w-32 border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none font-bold"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAddServicerOpen(false)}
                  className="bg-[#d4d0c8] px-3 py-1 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#104080] text-white px-4 py-1 font-bold text-xs rounded"
                >
                  {submitting ? "Creating..." : "Save Servicer Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Float Credit */}
      {isAddCreditOpen && activeServicer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#104080] shadow-2xl rounded-xs w-full max-w-md overflow-hidden">
            <div className="bg-[#104080] text-white px-3 py-2 flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider">Top-up Float — {activeServicer.name}</span>
              <button onClick={() => setIsAddCreditOpen(false)} className="text-white hover:text-red-300 font-bold">✕</button>
            </div>
            <form onSubmit={handleAddCredit} className="p-4 space-y-3">
              {modalError && (
                <div className="bg-rose-50 border border-rose-300 text-rose-700 px-3 py-1.5 rounded text-xs">
                  {modalError}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Amount (INR) <span className="text-red-500">*</span>:</label>
                <input
                  type="number"
                  step="0.01"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full border-2 border-[#104080] rounded px-2.5 py-1 text-sm font-extrabold focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Target Wallet:</label>
                  <select
                    value={creditWallet}
                    onChange={(e: any) => setCreditWallet(e.target.value)}
                    className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="bank">Bank Wallet</option>
                    <option value="cash">Cash / Hand Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Transfer Mode:</label>
                  <select
                    value={creditMode}
                    onChange={(e) => setCreditMode(e.target.value)}
                    className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="cash">Cash Handover</option>
                    <option value="cdm">CDM Deposit</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Bank UTR / Reference:</label>
                  <input
                    type="text"
                    value={creditUtr}
                    onChange={(e) => setCreditUtr(e.target.value)}
                    placeholder="UTR reference"
                    className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Entry Date:</label>
                  <FinacleDatePicker value={creditDate} onChange={setCreditDate} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Staff Note:</label>
                <input
                  type="text"
                  value={creditNote}
                  onChange={(e) => setCreditNote(e.target.value)}
                  placeholder="e.g. Morning float top-up"
                  className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button type="button" onClick={() => setIsAddCreditOpen(false)} className="bg-[#d4d0c8] px-3 py-1 font-bold text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-[#104080] text-white px-4 py-1 font-bold text-xs rounded">
                  {submitting ? "Saving..." : "Confirm Float Credit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ATM Cash Conversion */}
      {isConvertOpen && activeServicer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#104080] shadow-2xl rounded-xs w-full max-w-md overflow-hidden">
            <div className="bg-[#104080] text-white px-3 py-2 flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider">ATM Conversion / Internal Transfer</span>
              <button onClick={() => setIsConvertOpen(false)} className="text-white hover:text-red-300 font-bold">✕</button>
            </div>
            <form onSubmit={handleConvert} className="p-4 space-y-3">
              {modalError && (
                <div className="bg-rose-50 border border-rose-300 text-rose-700 px-3 py-1.5 rounded text-xs">
                  {modalError}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Amount to Convert (INR):</label>
                <input
                  type="number"
                  step="0.01"
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full border-2 border-[#104080] rounded px-2.5 py-1 text-sm font-extrabold focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">From Wallet:</label>
                  <select
                    value={convertFrom}
                    onChange={(e: any) => setConvertFrom(e.target.value)}
                    className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs"
                  >
                    <option value="bank">Bank Wallet (Withdraw)</option>
                    <option value="cash">Cash Wallet (Deposit)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">To Wallet:</label>
                  <select
                    value={convertTo}
                    onChange={(e: any) => setConvertTo(e.target.value)}
                    className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs"
                  >
                    <option value="cash">Cash Wallet</option>
                    <option value="bank">Bank Wallet</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button type="button" onClick={() => setIsConvertOpen(false)} className="bg-[#d4d0c8] px-3 py-1 font-bold text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-[#104080] text-white px-4 py-1 font-bold text-xs rounded">
                  {submitting ? "Converting..." : "Execute Conversion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Settle Commission */}
      {isSettleOpen && activeServicer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-amber-500 shadow-2xl rounded-xs w-full max-w-sm overflow-hidden">
            <div className="bg-amber-600 text-white px-3 py-2 flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider">Settle Commission Payout</span>
              <button onClick={() => setIsSettleOpen(false)} className="text-white hover:text-red-300 font-bold">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-700">
                Are you sure you want to mark all accrued commission as paid for <strong>{activeServicer.name}</strong>?
              </p>
              <div className="bg-amber-50 border border-amber-300 p-2.5 rounded text-center">
                <div className="text-[10px] text-gray-500 font-bold uppercase">Total Commission Due</div>
                <div className="text-xl font-extrabold text-amber-700 mt-0.5">
                  ₹ {activeServicer.wallet.accrued_commission.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button type="button" onClick={() => setIsSettleOpen(false)} className="bg-[#d4d0c8] px-3 py-1 font-bold text-xs">Cancel</button>
                <button
                  type="button"
                  onClick={handleSettleCommission}
                  disabled={submitting || activeServicer.wallet.accrued_commission <= 0}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-1 font-bold text-xs rounded disabled:opacity-50"
                >
                  {submitting ? "Settling..." : "Confirm Commission Paid"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Bank Bounce / Reversal */}
      {isBounceOpen && bounceTxn && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-rose-600 shadow-2xl rounded-xs w-full max-w-sm overflow-hidden">
            <div className="bg-rose-700 text-white px-3 py-2 flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider">Mark Transaction as Bounced</span>
              <button onClick={() => setIsBounceOpen(false)} className="text-white hover:text-red-300 font-bold">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-700">
                This will reverse the payout of <strong>₹ {bounceTxn.amount.toLocaleString("en-IN")}</strong> to <strong>{bounceTxn.beneficiary_name}</strong>.
              </p>
              <div className="text-[11px] text-gray-600 space-y-1 bg-rose-50 border border-rose-200 p-2 rounded">
                <div>• Restores <strong>₹ {bounceTxn.amount}</strong> to Servicer Bank Float</div>
                <div>• Resets Beneficiary to <strong>Pending / Awaiting Payout</strong></div>
                <div>• Cancels <strong>₹ {bounceTxn.commission_amount}</strong> earned commission</div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Bank Reversal Reason:</label>
                <input
                  type="text"
                  value={bounceReason}
                  onChange={(e) => setBounceReason(e.target.value)}
                  className="w-full border border-rose-300 rounded px-2 py-1 text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button type="button" onClick={() => setIsBounceOpen(false)} className="bg-[#d4d0c8] px-3 py-1 font-bold text-xs">Cancel</button>
                <button
                  type="button"
                  onClick={handleConfirmBounce}
                  disabled={submitting}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-1 font-bold text-xs rounded"
                >
                  {submitting ? "Bouncing..." : "Confirm Bank Bounce"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
