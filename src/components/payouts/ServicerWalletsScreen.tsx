import { useState, useEffect } from "react";
import FinacleDatePicker from "../FinacleDatePicker";
import api from "../../services/api";
import { 
  Building2, 
  CreditCard, 
  Banknote, 
  Plus, 
  ArrowLeftRight, 
  Award, 
  RefreshCw, 
  FileSpreadsheet, 
  RotateCcw,
  Search,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import * as XLSX from "xlsx";

export interface ServicerBankAccount {
  id?: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  ifsc_code: string;
  branch_name: string;
  account_type: "Current" | "Savings";
  is_primary: boolean;
}

interface EligibleCif {
  id: number | string;
  cif_no: string;
  first_name: string;
  last_name: string;
  short_name?: string;
  contact_number?: string;
  indian_number?: string;
  city?: string;
  country?: string;
  status: string;
  existing_servicer_id?: string | number | null;
  existing_servicer_code?: string | null;
}

interface Servicer {
  id: string | number;
  party_id?: number | string | null;
  cif_no?: string;
  servicer_code: string;
  name: string;
  phone: string;
  city: string;
  branch?: string;
  bank_name: string;
  account_no: string;
  ifsc_code: string;
  bank_accounts?: ServicerBankAccount[];
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
  servicer_name?: string;
  servicer_code?: string;
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
  const [, setLoadingStatement] = useState(false);

  // Filter States for Passbook & Statement
  const [statementServicerId, setStatementServicerId] = useState<string>("all");
  const [statementFromDate, setStatementFromDate] = useState<string>("");
  const [statementToDate, setStatementToDate] = useState<string>("");
  const [statementTxnType, setStatementTxnType] = useState<string>("all");
  const [statementSearchQuery, setStatementSearchQuery] = useState<string>("");

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
  const [eligibleCifs, setEligibleCifs] = useState<EligibleCif[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState<string>("");
  const [, setLoadingCifs] = useState(false);

  // New Servicer Form
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newBranch, setNewBranch] = useState<"INDIA" | "UAE">("INDIA");
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1);
  const [bankAccounts, setBankAccounts] = useState<ServicerBankAccount[]>([]);
  const [fetchingIfscIndex, setFetchingIfscIndex] = useState<number | null>(null);


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
  const [convertDate] = useState(() => new Date().toISOString().slice(0, 10));

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

  // Load Statement with Filters (Unified / Filtered)
  const fetchStatement = async (
    servicerId = statementServicerId,
    fromDate = statementFromDate,
    toDate = statementToDate,
    txnType = statementTxnType,
    search = statementSearchQuery
  ) => {
    setLoadingStatement(true);
    try {
      const res = await api.get("/payouts/statement", {
        params: {
          servicer_id: servicerId,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          txn_type: txnType !== "all" ? txnType : undefined,
          search: search.trim() || undefined,
        },
      });
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
    fetchStatement(statementServicerId, statementFromDate, statementToDate, statementTxnType, statementSearchQuery);
  }, [statementServicerId, statementFromDate, statementToDate, statementTxnType]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      fetchStatement(statementServicerId, statementFromDate, statementToDate, statementTxnType, statementSearchQuery);
    }, 350);
    return () => clearTimeout(t);
  }, [statementSearchQuery]);

  const activeServicer = servicers.find(s => String(s.id) === String(selectedId));

  // Fetch eligible verified servicer CIFs from Retail CIF master
  const fetchEligibleCifs = async () => {
    setLoadingCifs(true);
    try {
      const res = await api.get("/payouts/eligible-cifs");
      setEligibleCifs(res.data?.cifs || []);
    } catch (err) {
      console.error("Failed to load eligible CIFs:", err);
    } finally {
      setLoadingCifs(false);
    }
  };

  const handleOpenAddServicer = () => {
    setModalError("");
    fetchEligibleCifs();
    setSelectedPartyId("");
    setNewName("");
    setNewPhone("");
    setNewCity("");
    setNewBranch("INDIA");
    setModalStep(1);
    setBankAccounts([]);
    setIsAddServicerOpen(true);
  };

  const handleSelectCif = (partyId: string) => {
    setSelectedPartyId(partyId);
    if (!partyId) {
      setNewName("");
      setNewPhone("");
      setNewCity("");
      setNewBranch("INDIA");
      return;
    }
    const cif = eligibleCifs.find((c) => String(c.id) === String(partyId));
    if (cif) {
      const fullName = [cif.first_name, cif.last_name].filter(Boolean).join(" ");
      setNewName(fullName);
      setNewPhone(cif.contact_number || cif.indian_number || "");
      setNewCity(cif.city && cif.city !== "Unknown" ? cif.city : "");
      if (
        cif.country?.toUpperCase().includes("UAE") || 
        cif.country?.toUpperCase().includes("EMIRATES") || 
        String((cif as any).branch_id) === "1"
      ) {
        setNewBranch("UAE");
      } else {
        setNewBranch("INDIA");
      }
    }
  };

  // Bank accounts management within modal
  const handleAddBankAccount = () => {
    setBankAccounts(prev => [
      ...prev,
      {
        id: `ba_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        bank_name: "",
        account_number: "",
        account_holder: newName.trim() || "",
        ifsc_code: "",
        branch_name: "",
        account_type: "Current",
        is_primary: prev.length === 0,
      }
    ]);
  };

  const handleUpdateBankAccount = (index: number, field: keyof ServicerBankAccount, value: any) => {
    setBankAccounts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveBankAccount = (index: number) => {
    setBankAccounts(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some(a => a.is_primary)) {
        updated[0].is_primary = true;
      }
      return updated;
    });
  };

  const handleSetPrimaryBankAccount = (index: number) => {
    setBankAccounts(prev => prev.map((a, i) => ({ ...a, is_primary: i === index })));
  };

  const handleIfscLookup = async (index: number, ifsc: string) => {
    const cleanIfsc = ifsc.trim().toUpperCase();
    setBankAccounts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ifsc_code: cleanIfsc };
      return updated;
    });

    if (cleanIfsc.length === 11) {
      setFetchingIfscIndex(index);
      try {
        const res = await fetch(`https://ifsc.razorpay.com/${cleanIfsc}`);
        if (res.ok) {
          const data = await res.json();
          setBankAccounts(prev => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              ifsc_code: cleanIfsc,
              bank_name: data.BANK || updated[index].bank_name,
              branch_name: data.BRANCH || updated[index].branch_name,
            };
            return updated;
          });
        }
      } catch (err) {
        console.warn("IFSC lookup failed:", err);
      } finally {
        setFetchingIfscIndex(null);
      }
    }
  };

  // Handle Create / Open Servicer Account (Linked to CIF with auto-generated account)
  const handleCreateServicer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newName.trim()) { 
      setModalError("Servicer / CIF name is required"); 
      setModalStep(1);
      return; 
    }
    setSubmitting(true);
    setModalError("");

    const validBankAccounts = bankAccounts.filter(
      b => b.account_number.trim() || b.bank_name.trim() || b.ifsc_code.trim()
    );

    try {
      const res = await api.post("/payouts/servicers", {
        party_id: selectedPartyId ? selectedPartyId : undefined,
        name: newName.trim(),
        phone: newPhone.trim() || undefined,
        city: newCity.trim() || (newBranch === "UAE" ? "Dubai" : "India"),
        branch: newBranch,
        bank_accounts: validBankAccounts,
      });
      setIsAddServicerOpen(false);
      setNewName(""); setNewPhone(""); setNewCity(""); setNewBranch("INDIA");
      setBankAccounts([]);
      setModalStep(1);
      await fetchServicers(String(res.data?.servicer?.id));
    } catch (err: any) {
      setModalError(err.response?.data?.error || err.message || "Failed to create servicer account");
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
      await fetchStatement();
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
      await fetchStatement();
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
      await fetchStatement();
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
      await fetchStatement();
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
            onClick={handleOpenAddServicer}
            className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer"
            title="Open an Account and create digital wallet for a verified Servicer CIF"
          >
            <Plus className="w-3.5 h-3.5" /> Open Servicer Account (Link CIF)
          </button>
          <button
            onClick={() => { fetchServicers(selectedId); fetchStatement(); }}
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
            onChange={(e) => {
              const val = e.target.value;
              setSelectedId(val);
              setStatementServicerId(val);
            }}
            className="bg-white border-2 border-[#104080] rounded px-2.5 py-1 text-xs font-bold text-gray-900 focus:outline-none min-w-[280px] cursor-pointer"
          >
            {servicers.length === 0 ? (
              <option value="">No Servicer Accounts Yet — Click [Open Servicer Account] to activate</option>
            ) : (
              servicers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.cif_no ? `(${s.cif_no})` : `(${s.servicer_code})`} {s.account_no ? `• A/C: ${s.account_no}` : ""}
                </option>
              ))
            )}
          </select>
          {activeServicer && (
            <span className="text-[11px] text-gray-600 bg-white border border-[#c4d4ec] px-2 py-0.5 rounded flex items-center gap-2 flex-wrap">
              <span>👤 <strong>{activeServicer.cif_no || activeServicer.servicer_code}</strong></span>
              <span>🏦 A/C: <strong className="font-mono text-[#104080]">{activeServicer.account_no || "Auto"}</strong></span>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-mono font-bold text-[10px]">
                🏛️ IFSC: {activeServicer.ifsc_code || (activeServicer.branch === 'UAE' ? 'INFA0000002' : 'INFA0000001')}
              </span>
              <span className="bg-blue-50 text-[#104080] border border-blue-200 px-1.5 py-0.2 rounded font-bold text-[10px]">
                {activeServicer.branch === 'UAE' ? '🇦🇪 UAE' : '🇮🇳 INDIA'}
              </span>
              {activeServicer.bank_accounts && activeServicer.bank_accounts.length > 0 && (
                <span 
                  className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-1.5 py-0.2 rounded font-bold text-[10px]" 
                  title={activeServicer.bank_accounts.map(b => `${b.bank_name} (${b.account_number})`).join(", ")}
                >
                  💳 {activeServicer.bank_accounts.length} Bank A/C{activeServicer.bank_accounts.length > 1 ? "s" : ""}
                </span>
              )}
              <span>📍 {activeServicer.city || (activeServicer.branch === 'UAE' ? 'Dubai' : 'India')}</span>
              <span>📞 {activeServicer.phone || "No phone"}</span>
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
        <div className="flex items-center gap-2">
          <span>WALLET PASSBOOK & TRANSACTION STATEMENT</span>
          <span className="text-[10px] bg-white border border-[#a0a0a0] px-1.5 py-0.2 rounded text-gray-700 font-normal">
            {statement.length} Records
          </span>
        </div>
        <button
          onClick={exportStatementExcel}
          className="flex items-center gap-1 text-[#104080] hover:text-[#0c3162] cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export Statement
        </button>
      </div>

      {/* Finacle Filter Ribbon: Date, Servicer, Txn Type, and Search */}
      <div className="bg-[#f0f4f8] border-b border-[#c4d4ec] px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Servicer Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-[#c4d4ec] px-2 py-1 rounded">
            <span className="text-[#104080] font-bold text-[11px] flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Servicer:
            </span>
            <select
              value={statementServicerId}
              onChange={(e) => {
                const val = e.target.value;
                setStatementServicerId(val);
                if (val !== "all") {
                  setSelectedId(val);
                }
              }}
              className="bg-transparent text-xs font-semibold text-gray-800 focus:outline-none cursor-pointer"
            >
              <option value="all">📁 All Servicers (Consolidated)</option>
              {servicers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.servicer_code})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Date Pills */}
          <div className="flex items-center gap-1 bg-white border border-[#c4d4ec] rounded p-0.5">
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                setStatementFromDate(today);
                setStatementToDate(today);
              }}
              className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                statementFromDate === new Date().toISOString().slice(0, 10) &&
                statementToDate === new Date().toISOString().slice(0, 10)
                  ? "bg-[#104080] text-white"
                  : "hover:bg-[#e6edf8] text-[#1e4676]"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                const yest = d.toISOString().slice(0, 10);
                setStatementFromDate(yest);
                setStatementToDate(yest);
              }}
              className="px-2 py-0.5 text-[11px] font-bold hover:bg-[#e6edf8] text-[#1e4676] rounded cursor-pointer"
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => {
                setStatementFromDate("");
                setStatementToDate("");
              }}
              className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                !statementFromDate && !statementToDate
                  ? "bg-[#104080] text-white"
                  : "hover:bg-[#e6edf8] text-[#1e4676]"
              }`}
            >
              All Time
            </button>
          </div>

          {/* Date Pickers */}
          <div className="flex items-center gap-1.5 bg-white border border-[#c4d4ec] px-2 py-1 rounded">
            <span className="text-gray-500 text-[10px] font-semibold">From:</span>
            <FinacleDatePicker
              value={statementFromDate}
              onChange={(e) => setStatementFromDate(e.target.value)}
            />
            <span className="text-gray-500 text-[10px] font-semibold">To:</span>
            <FinacleDatePicker
              value={statementToDate}
              onChange={(e) => setStatementToDate(e.target.value)}
            />
            {(statementFromDate || statementToDate) && (
              <button
                type="button"
                onClick={() => {
                  setStatementFromDate("");
                  setStatementToDate("");
                }}
                className="text-gray-400 hover:text-red-500 font-bold ml-1 text-xs"
                title="Clear Dates"
              >
                ✕
              </button>
            )}
          </div>

          {/* Txn Type Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-[#c4d4ec] px-2 py-1 rounded">
            <span className="text-[#104080] font-bold text-[11px]">Type:</span>
            <select
              value={statementTxnType}
              onChange={(e) => setStatementTxnType(e.target.value)}
              className="bg-transparent text-xs text-gray-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="float_credit">Float Top-up (Credit)</option>
              <option value="payout_debit">Payout Debit</option>
              <option value="conversion">ATM Cash Convert</option>
              <option value="reimbursement">Pocket Reimbursement</option>
              <option value="commission_settle">Commission Paid</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={statementSearchQuery}
            onChange={(e) => setStatementSearchQuery(e.target.value)}
            placeholder="Search UTR, Txn#, Beneficiary..."
            className="bg-white border border-[#c4d4ec] rounded px-2.5 py-1 text-xs text-gray-700 w-[230px] pl-7 focus:outline-none focus:border-[#104080]"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2" />
          {statementSearchQuery && (
            <button
              onClick={() => setStatementSearchQuery("")}
              className="absolute right-2 top-1.5 text-gray-400 hover:text-red-500 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Statement Table */}
      <div className="flex-1 overflow-auto custom-scrollbar p-3">
        <div className="border border-[#c4d4ec] rounded-xs overflow-hidden shadow-2xs bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f0f4f8] border-b border-[#c4d4ec] text-[10px] font-extrabold text-[#104080] uppercase tracking-wider select-none">
                <th className="py-2 px-2.5 border-r border-[#c4d4ec]">Txn# & Date</th>
                {statementServicerId === "all" && (
                  <th className="py-2 px-2.5 border-r border-[#c4d4ec]">Servicer</th>
                )}
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
                  <td colSpan={statementServicerId === "all" ? 10 : 9} className="py-10 text-center text-gray-500">
                    No transactions found matching the selected filter criteria.
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

                      {/* Servicer Column (if All Servicers view) */}
                      {statementServicerId === "all" && (
                        <td className="py-2 px-2.5 border-r border-[#e2e8f0]">
                          <div className="font-bold text-[#104080]">{t.servicer_name || "Direct Company"}</div>
                          {t.servicer_code && <div className="text-[10px] text-gray-500 font-mono">{t.servicer_code}</div>}
                        </td>
                      )}

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

      {/* MODAL 1: Open Servicer Account (Link Retail CIF) - 3-Step Wizard */}
      {isAddServicerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border-2 border-[#104080] shadow-2xl rounded-xs w-full max-w-2xl overflow-hidden my-auto">
            {/* Modal Title Bar */}
            <div className="bg-[#104080] text-white px-3.5 py-2 flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>📁</span> Open Servicer Wallet Account (Link Retail CIF)
              </span>
              <button 
                onClick={() => setIsAddServicerOpen(false)} 
                className="text-white hover:text-red-300 font-bold text-sm leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Wizard Step Navigation Tabs */}
            <div className="bg-[#f0f4f8] px-3.5 py-2 border-b border-[#c4d4ec] flex items-center justify-between text-xs select-none">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setModalStep(1)}
                  className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[11px] cursor-pointer transition-colors ${
                    modalStep === 1 ? 'bg-[#104080] text-white shadow-2xs' : 'text-gray-700 bg-white border border-[#c4d4ec] hover:bg-gray-50'
                  }`}
                >
                  <span>1.</span> Profile & Operating Wallet
                </button>
                <span className="text-gray-400 font-bold">→</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!newName.trim()) { setModalError("Servicer name is required before proceeding to Step 2"); return; }
                    setModalError("");
                    if (bankAccounts.length === 0) handleAddBankAccount();
                    setModalStep(2);
                  }}
                  className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[11px] cursor-pointer transition-colors ${
                    modalStep === 2 ? 'bg-[#104080] text-white shadow-2xs' : 'text-gray-700 bg-white border border-[#c4d4ec] hover:bg-gray-50'
                  }`}
                >
                  <span>2.</span> Register Bank A/Cs ({bankAccounts.length})
                </button>
                <span className="text-gray-400 font-bold">→</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!newName.trim()) { setModalError("Servicer name is required"); setModalStep(1); return; }
                    setModalError("");
                    setModalStep(3);
                  }}
                  className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[11px] cursor-pointer transition-colors ${
                    modalStep === 3 ? 'bg-[#104080] text-white shadow-2xs' : 'text-gray-700 bg-white border border-[#c4d4ec] hover:bg-gray-50'
                  }`}
                >
                  <span>3.</span> Review & Activate
                </button>
              </div>
              <span className="text-[10px] text-gray-500 font-bold font-mono">
                Step {modalStep} of 3
              </span>
            </div>

            <div className="p-4 space-y-3.5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {modalError && (
                <div className="bg-rose-50 border border-rose-300 text-rose-700 px-3 py-1.5 rounded text-xs flex items-center justify-between">
                  <span>{modalError}</span>
                  <button onClick={() => setModalError("")} className="text-rose-600 hover:text-rose-900 font-bold ml-2">✕</button>
                </div>
              )}

              {/* ================= STEP 1: CURRENT COMPLETE STEP ================= */}
              {modalStep === 1 && (
                <div className="space-y-3">
                  {/* 1. CIF Selection (Filtered to hide already-linked CIFs) */}
                  <div className="bg-[#f0f4f8] border border-[#c4d4ec] p-2.5 rounded">
                    <label className="block text-[11px] font-extrabold text-[#104080] mb-1">
                      Step 1: Select Verified Servicer CIF (from Retail CIF Creation):
                    </label>
                    <select
                      value={selectedPartyId}
                      onChange={(e) => handleSelectCif(e.target.value)}
                      className="w-full bg-white border border-[#c4d4ec] rounded px-2 py-1 text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#104080]"
                    >
                      <option value="">-- Choose Verified Servicer CIF or Enter Manually --</option>
                      {eligibleCifs
                        .filter((c) => !c.existing_servicer_id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.cif_no} — {c.first_name} {c.last_name} {c.contact_number ? `(${c.contact_number})` : ""}
                          </option>
                      ))}
                    </select>
                    {selectedPartyId && (
                      <div className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
                        ✓ Linked to Master CIF Profile. Name & contact auto-inherited below.
                      </div>
                    )}
                    {eligibleCifs.filter((c) => !c.existing_servicer_id).length === 0 && (
                      <div className="text-[10px] text-amber-700 mt-1">
                        ℹ️ All verified servicer CIFs already have wallets, or none exist. You can onboard a new CIF under <strong>[ CREATE RETAIL CIF ]</strong> (CIF Type: SERVICER) or enter details manually below.
                      </div>
                    )}
                  </div>

                  {/* 2. Servicer Entity Details */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Servicer Full Name <span className="text-red-500">*</span>:</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#104080] font-semibold"
                      required
                    />
                  </div>

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

                  {/* 3. Auto-Generated Operating Account, Branch & IFSC Terms */}
                  <div className="bg-[#eef3f9] border border-[#c4d4ec] p-2.5 rounded space-y-2">
                    <div className="text-[11px] font-bold text-[#104080]">
                      Finacle Operating Branch & Auto-Generated Account / IFSC:
                    </div>

                    {/* Branch Selection (India & UAE) */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Select Operating Branch <span className="text-red-500">*</span>:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewBranch("INDIA")}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-bold border transition-all cursor-pointer ${
                            newBranch === "INDIA"
                              ? "bg-[#104080] text-white border-[#104080] shadow-2xs"
                              : "bg-white text-gray-700 border-[#c4d4ec] hover:bg-gray-50"
                          }`}
                        >
                          <span>🇮🇳</span> India Branch
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewBranch("UAE")}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-bold border transition-all cursor-pointer ${
                            newBranch === "UAE"
                              ? "bg-[#104080] text-white border-[#104080] shadow-2xs"
                              : "bg-white text-gray-700 border-[#c4d4ec] hover:bg-gray-50"
                          }`}
                        >
                          <span>🇦🇪</span> UAE Branch
                        </button>
                      </div>
                    </div>

                    {/* Account Number & IFSC Previews */}
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center justify-between text-xs bg-white border border-[#c4d4ec] px-2.5 py-1.5 rounded">
                        <span className="font-semibold text-gray-600">Finacle Operating A/C:</span>
                        <span className="font-mono font-extrabold text-[#104080] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          [ Auto-Generated on Activation ]
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs bg-white border border-[#c4d4ec] px-2.5 py-1.5 rounded">
                        <span className="font-semibold text-gray-600">
                          Branch IFSC / Clearing Code:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-extrabold text-[#166534] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300">
                            {newBranch === "UAE" ? "INFA0000002" : "INFA0000001"}
                          </span>
                          <span className="text-[10px] text-gray-500 font-bold uppercase">
                            ({newBranch === "UAE" ? "UAE Branch" : "India Branch"})
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-500 leading-relaxed pt-0.5">
                      ✓ Finacle operating account will be generated automatically upon activation.<br />
                      ✓ Auto-assigned IFSC <strong>{newBranch === "UAE" ? "INFA0000002" : "INFA0000001"}</strong> routes to the {newBranch === "UAE" ? "UAE" : "India"} clearing branch.<br />
                      ✓ External banks & payout accounts will be registered in Step 2.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setIsAddServicerOpen(false)}
                      className="bg-[#d4d0c8] hover:bg-[#e4e4e4] px-3 py-1.5 font-bold text-xs cursor-pointer border border-[#808080]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newName.trim()) { setModalError("Servicer / CIF name is required"); return; }
                        setModalError("");
                        if (bankAccounts.length === 0) handleAddBankAccount();
                        setModalStep(2);
                      }}
                      className="bg-[#104080] hover:bg-[#1a559e] text-white px-4 py-1.5 font-bold text-xs rounded cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <span>Proceed to Step 2: Register Bank A/Cs</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ================= STEP 2: REGISTER VERIFIED BANK A/CS ================= */}
              {modalStep === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-[#f0f4f8] border border-[#c4d4ec] p-2.5 rounded">
                    <div>
                      <h5 className="font-extrabold text-[#104080] text-xs m-0">
                        Step 2: Register Verified Indian Bank Accounts
                      </h5>
                      <span className="text-[10px] text-gray-600">
                        Add real bank accounts operated by {newName || "this servicer"} for payouts, IMPS/RTGS, and settlements.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddBankAccount}
                      className="bg-[#104080] hover:bg-[#1a559e] text-white px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Bank Account
                    </button>
                  </div>

                  {bankAccounts.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-[#c4d4ec] rounded bg-[#fafbfc]">
                      <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-gray-700">No bank accounts added yet</p>
                      <p className="text-[11px] text-gray-500 mb-2">You can add multiple Indian bank accounts or skip to Step 3</p>
                      <button
                        type="button"
                        onClick={handleAddBankAccount}
                        className="bg-[#104080] hover:bg-[#1a559e] text-white px-3 py-1 rounded text-xs font-bold cursor-pointer"
                      >
                        + Add First Bank Account
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {bankAccounts.map((acc, idx) => (
                        <div 
                          key={acc.id || idx} 
                          className={`border rounded p-2.5 space-y-2 relative transition-all ${
                            acc.is_primary ? 'bg-[#f8fbff] border-[#104080] shadow-xs' : 'bg-white border-[#c4d4ec]'
                          }`}
                        >
                          {/* Card Header */}
                          <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[11px] text-[#104080] flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" /> Bank Account #{idx + 1}
                              </span>
                              <label className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <input
                                  type="radio"
                                  name="primaryBankAccount"
                                  checked={acc.is_primary}
                                  onChange={() => handleSetPrimaryBankAccount(idx)}
                                  className="cursor-pointer"
                                />
                                {acc.is_primary ? "★ Primary Account" : "Set as Primary"}
                              </label>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveBankAccount(idx)}
                              className="text-gray-400 hover:text-red-600 p-0.5 rounded transition-colors cursor-pointer"
                              title="Remove Bank Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Inputs Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Account Holder Name:</label>
                              <input
                                type="text"
                                value={acc.account_holder}
                                onChange={(e) => handleUpdateBankAccount(idx, "account_holder", e.target.value)}
                                placeholder="Beneficiary / Account Holder Name"
                                className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Account Number <span className="text-red-500">*</span>:</label>
                              <input
                                type="text"
                                value={acc.account_number}
                                onChange={(e) => handleUpdateBankAccount(idx, "account_number", e.target.value)}
                                placeholder="e.g. 50100234567890"
                                className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs font-mono font-bold focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                                IFSC Code <span className="text-red-500">*</span> (11 digits):
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  maxLength={11}
                                  value={acc.ifsc_code}
                                  onChange={(e) => handleIfscLookup(idx, e.target.value)}
                                  placeholder="e.g. HDFC0001234"
                                  className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs font-mono font-bold uppercase focus:outline-none pr-6"
                                />
                                {fetchingIfscIndex === idx && (
                                  <RefreshCw className="w-3 h-3 text-[#104080] animate-spin absolute right-2 top-2" />
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Bank Name:</label>
                              <input
                                type="text"
                                value={acc.bank_name}
                                onChange={(e) => handleUpdateBankAccount(idx, "bank_name", e.target.value)}
                                placeholder="e.g. HDFC Bank"
                                className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Branch / City Name:</label>
                              <input
                                type="text"
                                value={acc.branch_name}
                                onChange={(e) => handleUpdateBankAccount(idx, "branch_name", e.target.value)}
                                placeholder="e.g. Nariman Point, Mumbai"
                                className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Account Type:</label>
                              <select
                                value={acc.account_type}
                                onChange={(e) => handleUpdateBankAccount(idx, "account_type", e.target.value as any)}
                                className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none bg-white font-semibold"
                              >
                                <option value="Current">Current Account</option>
                                <option value="Savings">Savings Account</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setModalStep(1)}
                      className="bg-[#d4d0c8] hover:bg-[#e4e4e4] px-3 py-1.5 font-bold text-xs cursor-pointer border border-[#808080] flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Step 1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalStep(3)}
                      className="bg-[#104080] hover:bg-[#1a559e] text-white px-4 py-1.5 font-bold text-xs rounded cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <span>Proceed to Step 3: Review & Activate</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ================= STEP 3: ACTIVATE ================= */}
              {modalStep === 3 && (
                <div className="space-y-3">
                  <div className="bg-[#f0f4f8] border border-[#c4d4ec] p-2.5 rounded">
                    <h5 className="font-extrabold text-[#104080] text-xs m-0">
                      Step 3: Review Details & Activate Finacle Wallet
                    </h5>
                    <span className="text-[10px] text-gray-600">
                      Confirm servicer identity, operating wallet parameters, and registered Indian bank accounts.
                    </span>
                  </div>

                  {/* Profile Summary Card */}
                  <div className="bg-white border border-[#c4d4ec] rounded p-2.5 space-y-1.5 text-xs">
                    <div className="font-bold text-[#104080] border-b border-gray-200 pb-1 flex items-center justify-between">
                      <span>Servicer Profile Summary:</span>
                      <span className="text-[10px] text-gray-500 font-normal">
                        {selectedPartyId ? "Linked to Master Retail CIF" : "Direct Onboarding"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-gray-500 font-semibold">Full Name:</span>{" "}
                        <strong className="text-gray-900">{newName || "-"}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold">Phone:</span>{" "}
                        <strong className="text-gray-900">{newPhone || "None provided"}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold">Operating Branch:</span>{" "}
                        <strong className="text-[#104080]">
                          {newBranch === "UAE" ? "🇦🇪 UAE Branch" : "🇮🇳 India Branch"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold">Clearing IFSC:</span>{" "}
                        <strong className="font-mono text-emerald-700">
                          {newBranch === "UAE" ? "INFA0000002" : "INFA0000001"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Registered Bank Accounts Summary */}
                  <div className="bg-white border border-[#c4d4ec] rounded p-2.5 space-y-1.5 text-xs">
                    <div className="font-bold text-[#104080] border-b border-gray-200 pb-1 flex items-center justify-between">
                      <span>Registered Indian Bank Accounts ({bankAccounts.filter(b => b.account_number).length}):</span>
                      <button
                        type="button"
                        onClick={() => setModalStep(2)}
                        className="text-[10px] text-[#104080] hover:underline font-bold"
                      >
                        Edit Accounts ✎
                      </button>
                    </div>

                    {bankAccounts.filter(b => b.account_number).length === 0 ? (
                      <div className="text-[11px] text-gray-500 italic py-1">
                        No bank accounts registered. Payout bank details can be selected dynamically during individual dispatches.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                        {bankAccounts.filter(b => b.account_number).map((acc, i) => (
                          <div key={i} className="flex items-center justify-between p-1.5 bg-[#f8fafc] rounded border border-gray-200 text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">{acc.bank_name || "Bank Account"}</span>
                              <span className="font-mono text-gray-700 font-semibold">{acc.account_number}</span>
                              <span className="font-mono text-xs text-gray-500">({acc.ifsc_code})</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {acc.is_primary && (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                                  Primary
                                </span>
                              )}
                              <span className="text-gray-500 text-[10px]">{acc.account_type}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setModalStep(2)}
                      className="bg-[#d4d0c8] hover:bg-[#e4e4e4] px-3 py-1.5 font-bold text-xs cursor-pointer border border-[#808080] flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Step 2</span>
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleCreateServicer()}
                      className="bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2 font-extrabold text-xs rounded cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{submitting ? "Activating Finacle Wallet..." : "🚀 Activate Finacle Wallet"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                  <FinacleDatePicker value={creditDate} onChange={(e) => setCreditDate(e.target.value)} />
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
