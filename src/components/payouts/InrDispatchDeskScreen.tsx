import React, { useState, useEffect } from "react";
import FinacleDatePicker from "../FinacleDatePicker";
import api from "../../services/api";
import { 
  FileSpreadsheet, 
  FileText, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Plus, 
  Wallet, 
  Building2, 
  Banknote, 
  RotateCcw, 
  Check,
  Copy,
  Trash2,
  Zap,
  ArrowLeftRight
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Helper to convert number to Indian words
function numberToIndianWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertLessThanOneThousand(n: number): string {
    let s = "";
    if (n >= 100) {
      s += a[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      s += b[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      s += a[n] + " ";
    }
    return s.trim();
  }

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remainder = Math.floor(num);

  let result = "";
  if (crore > 0) result += convertLessThanOneThousand(crore) + " Crore ";
  if (lakh > 0) result += convertLessThanOneThousand(lakh) + " Lakh ";
  if (thousand > 0) result += convertLessThanOneThousand(thousand) + " Thousand ";
  if (remainder > 0) result += convertLessThanOneThousand(remainder) + " ";

  return `Rupees ${result.trim()} Only`;
}

interface DebitEntryItem {
  id: number;
  txn_no: string;
  entry_date: string;
  servicer_id: number | null;
  servicer_name: string;
  servicer_code: string;
  cif_no: string;
  servicer_account_no: string;
  channel: "servicer" | "direct";
  wallet_type: "bank" | "cash" | "direct";
  beneficiary_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch_name: string;
  amount: number;
  payment_mode: string;
  utr_number: string;
  note: string;
  bounced: boolean;
  bounced_reason: string;
  created_at: string;
  created_by_name: string;
}

export interface PendingPayoutItem {
  id: string;
  order_id: number | string;
  order_no: string;
  order_date: string;
  party_name: string;
  party_id?: string | number;
  receiver_index: number;
  beneficiary_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch_name: string;
  inr_amount: number;
  paid_amount?: number;
  confirm_order_amount?: string | number;
  assigned_servicer?: string;
  payment_status: string;
}

export interface ServicerBankAccount {
  id?: string;
  bank_name: string;
  account_number: string;
  account_holder?: string;
  ifsc_code?: string;
  branch_name?: string;
  account_type?: "Current" | "Savings";
  is_primary?: boolean;
}

interface CreditTranche {
  id: string;
  utr: string;
  amount: string;
}

interface Servicer {
  id: string | number;
  servicer_code: string;
  name: string;
  cif_no: string;
  bank_name: string;
  account_no: string;
  ifsc_code: string;
  bank_accounts?: ServicerBankAccount[];
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
  const [records, setRecords] = useState<DebitEntryItem[]>([]);
  const [servicers, setServicers] = useState<Servicer[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    total_credited: 0,
    total_debited: 0,
    net_available: 0,
    total_debits: 0,
  });

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedServicerFilter, setSelectedServicerFilter] = useState("all");
  const [paymentModeFilter, setPaymentModeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "bounced">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal 1: New Debit Entry Modal
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Modal: Add Float Credit Modal
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [creditServicerId, setCreditServicerId] = useState("");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [totalCreditAmount, setTotalCreditAmount] = useState("");
  const [creditWallet, setCreditWallet] = useState<"bank" | "cash">("bank");
  const [creditMode, setCreditMode] = useState("bank_transfer");
  const [creditTranches, setCreditTranches] = useState<CreditTranche[]>([
    { id: "1", utr: "", amount: "" }
  ]);
  const [creditNote, setCreditNote] = useState("");
  const [creditDate, setCreditDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [creditSubmitting, setCreditSubmitting] = useState(false);
  const [creditError, setCreditError] = useState("");

  // Form Fields
  const [channel, setChannel] = useState<"servicer" | "direct">("servicer");
  const [selectedServicerId, setSelectedServicerId] = useState<string>("");
  const [debitFromAccountId, setDebitFromAccountId] = useState<string>("");
  const [walletType, setWalletType] = useState<"bank" | "cash">("bank");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryAccount, setBeneficiaryAccount] = useState("");
  const [beneficiaryIfsc, setBeneficiaryIfsc] = useState("");
  const [beneficiaryBank, setBeneficiaryBank] = useState("");
  const [beneficiaryBranch, setBeneficiaryBranch] = useState("");
  const [ifscStatus, setIfscStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [ifscError, setIfscError] = useState("");
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState("bank_transfer");
  const [utrNumber, setUtrNumber] = useState("");
  const [note, setNote] = useState("");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [savedBeneficiaries, setSavedBeneficiaries] = useState<any[]>([]);

  // Modal 2: View Details Voucher
  const [viewDetailsItem, setViewDetailsItem] = useState<DebitEntryItem | null>(null);

  // Modal 3: Bounce / Reverse Modal
  const [bounceItem, setBounceItem] = useState<DebitEntryItem | null>(null);
  const [bounceReason, setBounceReason] = useState("Account Closed / Invalid IFSC");
  const [bounceSubmitting, setBounceSubmitting] = useState(false);
  const [bounceError, setBounceError] = useState("");

  // Live Pending Payouts Queue (Booked Orders from UAE awaiting India dispatch)
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayoutItem[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [activeDeskTab, setActiveDeskTab] = useState<"dispatched_ledger" | "pending_queue">("dispatched_ledger");
  const [actioningPendingItem, setActioningPendingItem] = useState<PendingPayoutItem | null>(null);

  // Copy UTR feedback state
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Modal 4: Inter-Servicer Working Float Transfer
  const [isInterTransferOpen, setIsInterTransferOpen] = useState(false);
  const [transferFromId, setTransferFromId] = useState<string>("");
  const [transferToId, setTransferToId] = useState<string>("");
  const [transferFromWallet, setTransferFromWallet] = useState<"bank" | "cash">("bank");
  const [transferToWallet, setTransferToWallet] = useState<"bank" | "cash">("bank");
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [transferUtr, setTransferUtr] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferError, setTransferError] = useState("");

  // IFSC Autofetch effect
  useEffect(() => {
    const trimmed = beneficiaryIfsc.trim().toUpperCase();
    if (trimmed.length === 11) {
      setIfscStatus("loading");
      setIfscError("");
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`https://ifsc.razorpay.com/${trimmed}`);
          if (res.ok) {
            const data = await res.json();
            setBeneficiaryBank(data.BANK || "");
            setBeneficiaryBranch(data.BRANCH || "");
            setIfscStatus("success");
            setIfscError("");
          } else {
            setIfscStatus("error");
            setIfscError("Invalid IFSC code");
          }
        } catch (err) {
          console.error("IFSC lookup failed:", err);
          setIfscStatus("error");
          setIfscError("Lookup failed");
        }
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setIfscStatus("idle");
      setIfscError("");
    }
  }, [beneficiaryIfsc]);

  // Fetch Debit Entries & Servicers
  const fetchQueue = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      if (selectedServicerFilter !== "all") params.servicer_id = selectedServicerFilter;
      if (paymentModeFilter !== "all") params.payment_mode = paymentModeFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get("/payouts/dispatch-queue", { params });
      setRecords(res.data?.records || []);
      if (res.data?.summary) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error("Failed to load debit entries queue:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchServicers = async () => {
    try {
      const res = await api.get("/payouts/servicers");
      const list = res.data?.servicers || [];
      setServicers(list);
      if (list.length > 0 && !selectedServicerId) {
        setSelectedServicerId(String(list[0].id));
      }
    } catch (err) {
      console.error("Failed to load servicers:", err);
    }
  };

  // Fetch Saved Beneficiaries from Order Entry
  const fetchBeneficiaries = async () => {
    try {
      const res = await api.get("/records/beneficiaries");
      if (res.data?.beneficiaries && Array.isArray(res.data.beneficiaries)) {
        setSavedBeneficiaries(res.data.beneficiaries);
      }
    } catch (err) {
      console.warn("Failed to load order entry beneficiaries:", err);
    }
  };

  // Fetch Live Pending Payouts from Booked Orders (Order Entry)
  const fetchPendingOrders = async () => {
    setLoadingPending(true);
    try {
      const res = await api.get("/records/orders?page=1&limit=250");
      const orderList = res.data?.records || [];
      const extracted: PendingPayoutItem[] = [];

      for (const order of orderList) {
        if (order.status && String(order.status).toLowerCase() === "cancelled") continue;
        if (order.payment_status && String(order.payment_status).toLowerCase() === "cancelled") continue;

        let recs: any[] = order.receivers_data;
        if (typeof recs === "string") {
          try {
            recs = JSON.parse(recs);
          } catch {
            recs = [];
          }
        }
        if (!Array.isArray(recs)) recs = [];

        recs.forEach((rec: any, idx: number) => {
          const rawStatus = (rec.payment_status || order.payment_status || "Pending").toLowerCase();
          // Filter only unpaid beneficiaries waiting for dispatch in India
          if (rawStatus === "paid" || rawStatus === "completed" || rawStatus === "dispatched" || rawStatus === "cancelled") {
            return;
          }

          const inrAmt = parseFloat(rec.orderAmount || rec.inr_amount || rec.amount || 0);
          const paidAmt = parseFloat(rec.paid_amount || 0);
          const dispatchAmt = inrAmt > paidAmt ? inrAmt - paidAmt : inrAmt;

          extracted.push({
            id: `${order.id}-${idx}`,
            order_id: order.id,
            order_no: order.order_no || `ORD-${order.id}`,
            order_date: (order.order_date || "").split("T")[0],
            party_name: order.party_name || order.party_id || "N/A",
            party_id: order.party_id,
            receiver_index: idx,
            beneficiary_name: rec.clientName || rec.client_name || rec.beneficiary_name || "",
            account_number: rec.accountNumber || rec.account_number || rec.account_no || "",
            ifsc_code: (rec.ifscCode || rec.ifsc_code || "").toUpperCase(),
            bank_name: rec.bankName || rec.bank_name || "",
            branch_name: rec.branchName || rec.branch_name || "",
            inr_amount: dispatchAmt,
            paid_amount: paidAmt,
            confirm_order_amount: rec.confirmOrderAmount,
            assigned_servicer: rec.servicer || order.servicer || "",
            payment_status: rec.payment_status || order.payment_status || "Pending",
          });
        });
      }

      setPendingPayouts(extracted);
    } catch (err) {
      console.error("Failed to load live pending payouts queue:", err);
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchServicers();
    fetchBeneficiaries();
    fetchPendingOrders();
  }, [fromDate, toDate, selectedServicerFilter, paymentModeFilter]);

  // Debounced live search
  useEffect(() => {
    const t = setTimeout(() => {
      fetchQueue();
      fetchPendingOrders();
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Filter records by status (Active vs Bounced)
  const filteredRecords = records.filter((r) => {
    if (statusFilter === "active") return !r.bounced;
    if (statusFilter === "bounced") return r.bounced;
    return true;
  });

  // Filter pending payouts queue
  const filteredPendingPayouts = pendingPayouts.filter((item) => {
    if (fromDate && item.order_date < fromDate) return false;
    if (toDate && item.order_date > toDate) return false;
    if (selectedServicerFilter !== "all") {
      const matchServicer = servicers.find((s) => String(s.id) === String(selectedServicerFilter));
      if (matchServicer) {
        const itemServicer = (item.assigned_servicer || "").toLowerCase();
        const sName = matchServicer.name.toLowerCase();
        const sCode = matchServicer.servicer_code.toLowerCase();
        if (
          !itemServicer.includes(sName) &&
          !itemServicer.includes(sCode) &&
          String(matchServicer.id) !== item.assigned_servicer
        ) {
          return false;
        }
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        item.order_no.toLowerCase().includes(q) ||
        item.beneficiary_name.toLowerCase().includes(q) ||
        item.account_number.toLowerCase().includes(q) ||
        item.ifsc_code.toLowerCase().includes(q) ||
        item.bank_name.toLowerCase().includes(q) ||
        item.party_name.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Dynamically computed metrics reflecting all active filters
  const filteredSelectedServicer = servicers.find((s) => String(s.id) === String(selectedServicerFilter));

  // 1. Debited Outflow & Count based on filtered records
  const dynamicTotalDebited = filteredRecords.reduce((acc, r) => {
    if (statusFilter === "bounced") return acc + (Number(r.amount) || 0);
    return r.bounced ? acc : acc + (Number(r.amount) || 0);
  }, 0);
  const dynamicDebitCount = filteredRecords.filter((r) => statusFilter === "bounced" ? r.bounced : !r.bounced).length;

  // 2. Pending Orders Queue based on filtered pending items
  const filteredPendingInr = filteredPendingPayouts.reduce((acc, p) => acc + (p.inr_amount || 0), 0);
  const filteredPendingCount = filteredPendingPayouts.length;

  // 3. Credited Float & Available Float
  const dynamicTotalCredited = summary.total_credited > 0 
    ? summary.total_credited 
    : (filteredSelectedServicer ? (filteredSelectedServicer.wallet?.total_float || 0) + dynamicTotalDebited : dynamicTotalDebited);

  const dynamicNetAvailable = filteredSelectedServicer && !fromDate && !toDate
    ? (filteredSelectedServicer.wallet?.total_float || 0)
    : Math.max(0, dynamicTotalCredited - dynamicTotalDebited);

  const dynamicDisbursementRatio = dynamicTotalCredited > 0
    ? Math.min(100, Math.round((dynamicTotalDebited / dynamicTotalCredited) * 100))
    : 0;

  // Active Servicer helper for modal
  const activeServicer = servicers.find((s) => String(s.id) === String(selectedServicerId));
  const amountNum = parseFloat(payoutAmount) || 0;
  const commissionRate = channel === "servicer" && activeServicer ? activeServicer.commission_rate : 0;
  const commissionEarned = Math.round(amountNum * (commissionRate / 100) * 100) / 100;

  // Inter-Servicer Transfer helpers
  const fromServicerObj = servicers.find((s) => String(s.id) === String(transferFromId));
  const toServicerObj = servicers.find((s) => String(s.id) === String(transferToId));
  const sourceAvailable = transferFromWallet === "bank"
    ? (fromServicerObj?.wallet?.bank_balance || 0)
    : (fromServicerObj?.wallet?.cash_balance || 0);
  const targetCurrent = transferToWallet === "bank"
    ? (toServicerObj?.wallet?.bank_balance || 0)
    : (toServicerObj?.wallet?.cash_balance || 0);
  const transferAmountNum = parseFloat(transferAmount) || 0;

  // Available Bank Accounts for the selected servicer in Debit Entry modal (From A/C)
  const availableDebitBankAccounts = React.useMemo(() => {
    if (!activeServicer) return [];
    const accounts: { value: string; label: string }[] = [];
    if (activeServicer.bank_accounts && activeServicer.bank_accounts.length > 0) {
      activeServicer.bank_accounts.forEach((b) => {
        accounts.push({
          value: b.account_number,
          label: `${b.bank_name || "Bank"} — A/C: ${b.account_number} (${b.ifsc_code || "No IFSC"})${b.account_holder ? ` • ${b.account_holder}` : ""}${b.is_primary ? " [PRIMARY]" : ""}`
        });
      });
    } else if (activeServicer.account_no) {
      accounts.push({
        value: activeServicer.account_no,
        label: `${activeServicer.bank_name || "Bank"} — A/C: ${activeServicer.account_no} (${activeServicer.ifsc_code || ""}) [OPERATING]`
      });
    }
    accounts.push({
      value: "cash",
      label: "Cash Handover / Hand Wallet"
    });
    return accounts;
  }, [activeServicer]);

  // Auto-select primary or first account when selected servicer or wallet bucket changes
  useEffect(() => {
    if (!activeServicer) {
      setDebitFromAccountId("");
      return;
    }
    if (walletType === "cash") {
      setDebitFromAccountId("cash");
    } else if (activeServicer.bank_accounts && activeServicer.bank_accounts.length > 0) {
      const primary = activeServicer.bank_accounts.find(b => b.is_primary) || activeServicer.bank_accounts[0];
      setDebitFromAccountId(primary.account_number);
    } else if (activeServicer.account_no) {
      setDebitFromAccountId(activeServicer.account_no);
    } else {
      setDebitFromAccountId("cash");
    }
  }, [activeServicer, walletType]);

  // Order Entry Beneficiary Autocomplete Lists
  const uniqueBeneficiaryNames = React.useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];
    savedBeneficiaries.forEach(b => {
      const name = (b.client_name || "").trim();
      const key = `${name.toUpperCase()}__${(b.account_number || "").trim()}`;
      if (name && !seen.has(key)) {
        seen.add(key);
        list.push(b);
      }
    });
    return list;
  }, [savedBeneficiaries]);

  const uniqueBeneficiaryAccounts = React.useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];
    savedBeneficiaries.forEach(b => {
      const acc = (b.account_number || "").trim();
      if (acc && !seen.has(acc)) {
        seen.add(acc);
        list.push(b);
      }
    });
    return list;
  }, [savedBeneficiaries]);

  // Auto-fill from Order Entry suggestions
  const handleBeneficiaryNameChange = (val: string) => {
    setBeneficiaryName(val);
    const trimmed = val.trim().toUpperCase();
    if (trimmed) {
      const match = savedBeneficiaries.find(b => (b.client_name || "").toUpperCase() === trimmed);
      if (match) {
        if (match.account_number) setBeneficiaryAccount(match.account_number);
        if (match.ifsc_code) {
          setBeneficiaryIfsc(match.ifsc_code.toUpperCase());
          setBeneficiaryBank(match.bank_name || "");
          setBeneficiaryBranch(match.branch_name || "");
          setIfscStatus("success");
        }
      }
    }
  };

  const handleBeneficiaryAccountChange = (val: string) => {
    setBeneficiaryAccount(val);
    const trimmed = val.trim();
    if (trimmed) {
      const match = savedBeneficiaries.find(b => (b.account_number || "").trim() === trimmed);
      if (match) {
        if (match.client_name) setBeneficiaryName(match.client_name);
        if (match.ifsc_code) {
          setBeneficiaryIfsc(match.ifsc_code.toUpperCase());
          setBeneficiaryBank(match.bank_name || "");
          setBeneficiaryBranch(match.branch_name || "");
          setIfscStatus("success");
        }
      }
    }
  };

  // Active Credit Servicer & Available Bank Accounts
  const activeCreditServicer = servicers.find(s => String(s.id) === String(creditServicerId));

  const availableBankAccounts = React.useMemo(() => {
    if (!activeCreditServicer) return [];
    const accounts: { value: string; label: string }[] = [];
    if (activeCreditServicer.bank_accounts && activeCreditServicer.bank_accounts.length > 0) {
      activeCreditServicer.bank_accounts.forEach((b) => {
        accounts.push({
          value: b.account_number,
          label: `${b.bank_name || "Bank"} — A/C: ${b.account_number} (${b.ifsc_code || "No IFSC"})${b.account_holder ? ` • ${b.account_holder}` : ""}${b.is_primary ? " [PRIMARY]" : ""}`
        });
      });
    } else if (activeCreditServicer.account_no) {
      accounts.push({
        value: activeCreditServicer.account_no,
        label: `${activeCreditServicer.bank_name || "Bank"} — A/C: ${activeCreditServicer.account_no} (${activeCreditServicer.ifsc_code || ""}) [OPERATING]`
      });
    }
    accounts.push({
      value: "other",
      label: "Other Account / Physical Cash Deposit"
    });
    return accounts;
  }, [activeCreditServicer]);

  // Auto-select primary or first account when servicer changes
  useEffect(() => {
    if (!activeCreditServicer) {
      setSelectedBankAccountId("");
      return;
    }
    if (activeCreditServicer.bank_accounts && activeCreditServicer.bank_accounts.length > 0) {
      const primary = activeCreditServicer.bank_accounts.find(b => b.is_primary) || activeCreditServicer.bank_accounts[0];
      setSelectedBankAccountId(primary.account_number);
    } else if (activeCreditServicer.account_no) {
      setSelectedBankAccountId(activeCreditServicer.account_no);
    } else {
      setSelectedBankAccountId("other");
    }
  }, [activeCreditServicer]);

  // Tranche helper functions & validation
  const masterTotal = parseFloat(totalCreditAmount) || 0;
  const tranchesSum = creditTranches.reduce((sum, t) => {
    const val = parseFloat(t.amount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  const difference = Math.round((masterTotal - tranchesSum) * 100) / 100;
  const isBalanced = masterTotal > 0 && Math.abs(difference) < 0.01;

  // Handle master total amount change (auto-sync first row if single entry)
  const handleTotalAmountChange = (val: string) => {
    setTotalCreditAmount(val);
    if (creditTranches.length === 1) {
      setCreditTranches([{ ...creditTranches[0], amount: val }]);
    }
  };

  const addTrancheRow = () => {
    setCreditTranches(prev => [
      ...prev,
      { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), utr: "", amount: "" }
    ]);
  };

  const removeTrancheRow = (id: string) => {
    if (creditTranches.length <= 1) return;
    setCreditTranches(prev => prev.filter(t => t.id !== id));
  };

  const updateTranche = (id: string, field: "utr" | "amount", val: string) => {
    setCreditTranches(prev =>
      prev.map(t => (t.id === id ? { ...t, [field]: val } : t))
    );
  };

  // Open Inter-Servicer Transfer Modal
  const handleOpenInterTransfer = () => {
    setTransferAmount("");
    setTransferUtr("");
    setTransferNote("");
    setTransferError("");
    setTransferDate(new Date().toISOString().slice(0, 10));
    setTransferFromWallet("bank");
    setTransferToWallet("bank");

    const defaultFrom = servicers.length > 0 ? String(servicers[0].id) : "";
    setTransferFromId(defaultFrom);

    const defaultTo = servicers.find((s) => String(s.id) !== defaultFrom);
    setTransferToId(defaultTo ? String(defaultTo.id) : "");

    setIsInterTransferOpen(true);
  };

  // Submit Inter-Servicer Float Transfer
  const handleInterTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0) {
      setTransferError("Please enter a valid transfer amount greater than ₹0");
      return;
    }
    if (!transferFromId || !transferToId) {
      setTransferError("Please select both source and destination servicers");
      return;
    }
    if (transferFromId === transferToId) {
      setTransferError("Source and destination servicers must be different");
      return;
    }

    const fromServicer = servicers.find((s) => String(s.id) === String(transferFromId));
    const availableFloat = transferFromWallet === "bank"
      ? (fromServicer?.wallet?.bank_balance || 0)
      : (fromServicer?.wallet?.cash_balance || 0);

    if (amt > availableFloat) {
      setTransferError(
        `Insufficient ${transferFromWallet === "bank" ? "Bank" : "Cash"} Float. Available: ₹${availableFloat.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      );
      return;
    }

    setTransferSubmitting(true);
    setTransferError("");

    try {
      const res = await api.post("/payouts/servicers/inter-transfer", {
        from_servicer_id: transferFromId,
        to_servicer_id: transferToId,
        from_wallet: transferFromWallet,
        to_wallet: transferToWallet,
        amount: amt,
        utr_number: transferUtr.trim() || undefined,
        note: transferNote.trim() || undefined,
        entry_date: transferDate,
      });

      setIsInterTransferOpen(false);
      setTransferAmount("");
      setTransferUtr("");
      setTransferNote("");
      setSuccessToast(res.data?.message || `Successfully transferred ₹${amt.toLocaleString("en-IN")} float between servicers!`);
      setTimeout(() => setSuccessToast(""), 5000);
      await fetchQueue();
      await fetchServicers();
    } catch (err: any) {
      setTransferError(err.response?.data?.error || err.message || "Failed to execute inter-servicer float transfer");
    } finally {
      setTransferSubmitting(false);
    }
  };

  // Open Float Credit Modal
  const handleOpenCreditModal = () => {
    setCreditError("");
    setTotalCreditAmount("");
    setCreditTranches([{ id: "1", utr: "", amount: "" }]);
    setCreditNote("");
    setCreditWallet("bank");
    setCreditMode("bank_transfer");
    setCreditDate(new Date().toISOString().slice(0, 10));
    if (servicers.length > 0) {
      setCreditServicerId(String(servicers[0].id));
    }
    setIsCreditModalOpen(true);
  };

  // Submit Float Credit (Option A: Individual transaction per UTR)
  const handleAddCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditServicerId) {
      setCreditError("Please select a servicer");
      return;
    }
    if (!masterTotal || masterTotal <= 0) {
      setCreditError("Please enter a valid total credit amount");
      return;
    }
    if (creditTranches.length === 0) {
      setCreditError("Please add at least one transfer entry with an amount");
      return;
    }
    const invalidTranche = creditTranches.find(t => !parseFloat(t.amount) || parseFloat(t.amount) <= 0);
    if (invalidTranche) {
      setCreditError("Every entry row must contain a valid positive amount");
      return;
    }
    if (!isBalanced) {
      setCreditError(`Tranche sum (₹${tranchesSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}) must exactly match total credit amount (₹${masterTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })})`);
      return;
    }

    setCreditSubmitting(true);
    setCreditError("");

    // Identify bank account label for ledger note
    let bankAccountLabel = "";
    if (selectedBankAccountId && selectedBankAccountId !== "other") {
      const match = activeCreditServicer?.bank_accounts?.find(b => b.account_number === selectedBankAccountId);
      if (match) {
        bankAccountLabel = `${match.bank_name} (${match.account_number.slice(-4)})`;
      } else if (activeCreditServicer?.account_no === selectedBankAccountId) {
        bankAccountLabel = `${activeCreditServicer.bank_name} (${activeCreditServicer.account_no.slice(-4)})`;
      }
    }

    try {
      // Option A: Submit each tranche as an individual ledger transaction
      for (let i = 0; i < creditTranches.length; i++) {
        const tranche = creditTranches[i];
        const amt = parseFloat(tranche.amount);
        const splitPrefix = creditTranches.length > 1 ? `Split ${i + 1}/${creditTranches.length}` : "";
        const noteParts = [
          bankAccountLabel ? `A/C: ${bankAccountLabel}` : "",
          splitPrefix,
          creditNote.trim()
        ].filter(Boolean);

        await api.post(`/payouts/servicers/${creditServicerId}/credit`, {
          amount: amt,
          wallet_type: creditWallet,
          payment_mode: creditMode,
          utr_number: tranche.utr.trim() || undefined,
          note: noteParts.length > 0 ? noteParts.join(" • ") : undefined,
          entry_date: creditDate,
        });
      }

      setIsCreditModalOpen(false);
      setTotalCreditAmount("");
      setCreditTranches([{ id: "1", utr: "", amount: "" }]);
      setCreditNote("");

      const totalFmt = masterTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 });
      setSuccessToast(
        creditTranches.length > 1
          ? `₹${totalFmt} float credited across ${creditTranches.length} transactions to ${activeCreditServicer?.name || "servicer"} (${creditWallet === "bank" ? "Bank Wallet" : "Cash Wallet"}).`
          : `₹${totalFmt} float credited to ${activeCreditServicer?.name || "servicer"} (${creditWallet === "bank" ? "Bank Wallet" : "Cash Wallet"}).`
      );
      setTimeout(() => setSuccessToast(""), 5000);
      await fetchQueue();
      await fetchServicers();
      await fetchPendingOrders();
    } catch (err: any) {
      setCreditError(err.response?.data?.error || err.message || "Failed to add float credit");
    } finally {
      setCreditSubmitting(false);
    }
  };

  // Open New Debit Entry Modal
  const handleOpenNewEntry = () => {
    setActioningPendingItem(null);
    setBeneficiaryName("");
    setBeneficiaryAccount("");
    setBeneficiaryIfsc("");
    setBeneficiaryBank("");
    setBeneficiaryBranch("");
    setIfscStatus("idle");
    setIfscError("");
    setPayoutAmount("");
    setPaymentMode("bank_transfer");
    setUtrNumber("");
    setNote("");
    setFormError("");
    setEntryDate(new Date().toISOString().slice(0, 10));
    setChannel("servicer");
    setWalletType("bank");
    if (servicers.length > 0) {
      setSelectedServicerId(String(servicers[0].id));
    }
    fetchBeneficiaries();
    setIsEntryModalOpen(true);
  };

  // Action Payout from Live Pending Queue (Pre-fills Order #, Beneficiary, A/C, IFSC, Exact Converted INR Amount)
  const handleActionPayout = (item: PendingPayoutItem) => {
    setActioningPendingItem(item);
    setBeneficiaryName(item.beneficiary_name);
    setBeneficiaryAccount(item.account_number);
    setBeneficiaryIfsc(item.ifsc_code);
    setBeneficiaryBank(item.bank_name);
    setBeneficiaryBranch(item.branch_name);
    setPayoutAmount(item.inr_amount > 0 ? String(item.inr_amount) : "");
    setPaymentMode("bank_transfer");
    setUtrNumber("");
    setNote(`Order #${item.order_no}${item.party_name ? ` • Client: ${item.party_name}` : ""}`);
    setFormError("");
    setEntryDate(new Date().toISOString().slice(0, 10));
    setChannel("servicer");
    setWalletType("bank");

    // Match assigned servicer if available
    if (item.assigned_servicer && servicers.length > 0) {
      const match = servicers.find(
        (s) =>
          String(s.id) === String(item.assigned_servicer) ||
          s.name.toLowerCase() === item.assigned_servicer?.toLowerCase() ||
          s.servicer_code.toLowerCase() === item.assigned_servicer?.toLowerCase()
      );
      if (match) {
        setSelectedServicerId(String(match.id));
      } else {
        setSelectedServicerId(String(servicers[0].id));
      }
    } else if (servicers.length > 0) {
      setSelectedServicerId(String(servicers[0].id));
    }

    if (item.ifsc_code && item.ifsc_code.length === 11) {
      setIfscStatus("loading");
      fetch(`https://ifsc.razorpay.com/${item.ifsc_code}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.BANK) {
            setBeneficiaryBank(data.BANK || item.bank_name);
            setBeneficiaryBranch(data.BRANCH || item.branch_name);
            setIfscStatus("success");
          } else {
            setIfscStatus("idle");
          }
        })
        .catch(() => setIfscStatus("idle"));
    } else {
      setIfscStatus("idle");
    }

    fetchBeneficiaries();
    setIsEntryModalOpen(true);
  };

  // Submit Direct Debit Entry (Beneficiary Payout)
  const handleSubmitDebitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beneficiaryName.trim()) {
      setFormError("Beneficiary name is mandatory.");
      return;
    }
    if (amountNum <= 0) {
      setFormError("Please enter a valid payout amount greater than ₹ 0.");
      return;
    }
    if (!utrNumber.trim()) {
      setFormError("Bank UTR / Transaction Reference number is mandatory.");
      return;
    }
    if (channel === "servicer" && !selectedServicerId) {
      setFormError("Please select a servicer to execute this debit.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    const fromAccNote = channel === "servicer" && debitFromAccountId && debitFromAccountId !== "cash"
      ? `From A/C: ${debitFromAccountId}`
      : "";
    const combinedNote = [fromAccNote, note.trim()].filter(Boolean).join(" • ");

    try {
      const res = await api.post("/payouts/dispatch", {
        channel,
        servicer_id: channel === "servicer" ? selectedServicerId : null,
        wallet_type: channel === "direct" ? "direct" : walletType,
        from_account: channel === "servicer" ? debitFromAccountId : undefined,
        beneficiary_name: beneficiaryName.trim(),
        beneficiary_account: beneficiaryAccount.trim(),
        beneficiary_ifsc: beneficiaryIfsc.trim().toUpperCase(),
        beneficiary_bank: beneficiaryBank.trim(),
        beneficiary_branch: beneficiaryBranch.trim(),
        actual_paid_amount: amountNum,
        payment_mode: paymentMode,
        utr_number: utrNumber.trim(),
        note: combinedNote || undefined,
        entry_date: entryDate,
      });

      // If actioned from pending queue, update receiver status in booked order
      if (actioningPendingItem) {
        try {
          await api.patch(
            `/records/orders/${actioningPendingItem.order_id}/receiver/${actioningPendingItem.receiver_index}`,
            {
              payment_status: "paid",
              paid_amount: amountNum,
            }
          );
        } catch (patchErr) {
          console.warn("Could not auto-update order receiver payment status:", patchErr);
        }
        setActioningPendingItem(null);
      }

      setIsEntryModalOpen(false);
      setSuccessToast(res.data?.message || `Debit entry of ₹ ${amountNum.toLocaleString("en-IN")} recorded successfully!`);
      setTimeout(() => setSuccessToast(""), 4500);

      fetchQueue();
      fetchServicers();
      fetchPendingOrders();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || "Failed to record beneficiary payout debit.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Bounce / Reversal
  const handleConfirmBounce = async () => {
    if (!bounceItem) return;
    setBounceSubmitting(true);
    setBounceError("");
    try {
      await api.post(`/payouts/transactions/${bounceItem.id}/bounce`, {
        reason: bounceReason,
      });
      setBounceItem(null);
      setSuccessToast(`Transaction ${bounceItem.txn_no} reversed. Funds restored to servicer float.`);
      setTimeout(() => setSuccessToast(""), 4500);
      fetchQueue();
      fetchServicers();
      fetchPendingOrders();
    } catch (err: any) {
      setBounceError(err.response?.data?.error || err.message || "Failed to bounce transaction.");
    } finally {
      setBounceSubmitting(false);
    }
  };

  // Copy to clipboard helper
  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  // Export to Excel
  const exportToExcel = () => {
    const data = filteredRecords.map((r) => ({
      "Debit / Txn No": r.txn_no,
      "Entry Date": r.entry_date,
      "Channel": r.channel === "direct" ? "Company Direct" : "Servicer",
      "Servicer Code": r.servicer_code || "-",
      "Servicer Name": r.servicer_name,
      "Servicer Finacle A/C": r.servicer_account_no || "-",
      "Beneficiary Name": r.beneficiary_name,
      "Account Number": r.account_number || "-",
      "IFSC Code": r.ifsc_code || "-",
      "Bank Name": r.bank_name || "-",
      "Branch Name": r.branch_name || "-",
      "Amount Paid (INR)": r.amount,
      "Payment Mode": r.payment_mode,
      "Wallet Bucket": r.wallet_type,
      "UTR / Reference": r.utr_number,
      "Status": r.bounced ? "BOUNCED / REVERSED" : "COMPLETED",
      "Bounced Reason": r.bounced_reason || "-",
      "Staff Remarks": r.note || "-",
      "Recorded By": r.created_by_name,
      "Timestamp": r.created_at,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Debit Entries");
    XLSX.writeFile(wb, `INR_Beneficiary_Payout_Debits_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Export to PDF
  const exportToPdf = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(14);
    doc.text("FINCORE UNIVERSAL SETTLEMENT — DIRECT BENEFICIARY PAYOUT (DEBIT ENTRY) DESK", 14, 15);
    doc.setFontSize(9);
    doc.text(
      `Generated: ${new Date().toLocaleString()} | Total Credited Float: INR ${summary.total_credited.toLocaleString()} | Total Debited: INR ${summary.total_debited.toLocaleString()} | Net Available: INR ${summary.net_available.toLocaleString()}`,
      14,
      22
    );

    autoTable(doc, {
      startY: 26,
      head: [["Txn #", "Date", "Servicer / Source", "Beneficiary", "A/C Number", "IFSC", "Bank & Branch", "Amount (INR)", "Mode", "UTR / Ref", "Status"]],
      body: filteredRecords.map((r) => [
        r.txn_no,
        r.entry_date,
        r.servicer_name,
        r.beneficiary_name,
        r.account_number || "-",
        r.ifsc_code || "-",
        `${r.bank_name} ${r.branch_name ? `(${r.branch_name})` : ""}`.trim() || "-",
        r.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
        r.payment_mode,
        r.utr_number,
        r.bounced ? "BOUNCED" : "SUCCESS",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 64, 128] },
    });

    doc.save(`INR_Beneficiary_Payout_Debits_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden text-xs">
      {/* Finacle Top Command Header */}
      <div className="bg-[#104080] text-white px-3 py-1.5 flex items-center justify-between border-b border-[#0a2850] shadow-xs select-none">
        <div className="flex items-center gap-2">
          <span className="text-sm">📁</span>
          <span className="font-bold tracking-wider text-xs">
            FINCORE UNIVERSAL SETTLEMENT — DIRECT BENEFICIARY PAYOUT (DEBIT ENTRY) DESK
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenInterTransfer}
            className="flex items-center gap-1.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white px-3 py-1 rounded text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            title="Directly rebalance working float between two servicers"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" /> ⇄ Inter-Servicer Transfer
          </button>
          <button
            onClick={handleOpenCreditModal}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            title="Inject float credit into a servicer's operating wallet"
          >
            <Plus className="w-3.5 h-3.5" /> + Add Float (Credit)
          </button>
          <button
            onClick={handleOpenNewEntry}
            className="flex items-center gap-1.5 bg-[#d4af37] hover:bg-[#c49f27] text-[#0a2850] px-3 py-1 rounded text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            title="Log a direct beneficiary payout debit"
          >
            <Plus className="w-3.5 h-3.5" /> + New Debit Entry
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1 bg-[#23528f] hover:bg-[#1a4073] text-white px-2 py-1 rounded text-[11px] font-bold cursor-pointer"
            title="Export Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Excel
          </button>
          <button
            onClick={exportToPdf}
            className="flex items-center gap-1 bg-[#23528f] hover:bg-[#1a4073] text-white px-2 py-1 rounded text-[11px] font-bold cursor-pointer"
            title="Export PDF"
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" /> PDF
          </button>
          <button
            onClick={() => { fetchQueue(); fetchServicers(); fetchPendingOrders(); }}
            className="flex items-center gap-1 bg-[#23528f] hover:bg-[#1a4073] text-white px-2 py-1 rounded text-[11px] font-bold cursor-pointer"
            title="Refresh Desks"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(loading || loadingPending) ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="bg-emerald-600 text-white px-4 py-1.5 flex items-center justify-between text-xs font-bold animate-in fade-in duration-200 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast("")} className="text-white hover:text-emerald-200 font-bold cursor-pointer">✕</button>
        </div>
      )}

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
            <FinacleDatePicker value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <span className="text-gray-500 text-[10px] font-semibold">To:</span>
            <FinacleDatePicker value={toDate} onChange={(e) => setToDate(e.target.value)} />
            {(fromDate || toDate) && (
              <button
                onClick={() => { setFromDate(""); setToDate(""); }}
                className="text-gray-400 hover:text-red-500 font-bold ml-1 text-xs cursor-pointer"
                title="Clear Dates"
              >
                ✕
              </button>
            )}
          </div>

          {/* Servicer Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-[#c4d4ec] px-2 py-1 rounded">
            <span className="text-[#1e4676] font-bold text-[11px]">Servicer:</span>
            <select
              value={selectedServicerFilter}
              onChange={(e) => setSelectedServicerFilter(e.target.value)}
              className="bg-transparent text-xs text-gray-800 focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="all">All Servicers</option>
              {servicers.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.servicer_code}] {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-[#c4d4ec] px-2 py-1 rounded">
            <span className="text-[#1e4676] font-bold text-[11px]">Mode:</span>
            <select
              value={paymentModeFilter}
              onChange={(e) => setPaymentModeFilter(e.target.value)}
              className="bg-transparent text-xs text-gray-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Modes</option>
              <option value="bank_transfer">Bank Transfer (IMPS/NEFT)</option>
              <option value="cdm">CDM Cash Deposit</option>
              <option value="upi">UPI / QR Transfer</option>
              <option value="cash">Direct Cash Handover</option>
              <option value="cheque">Cheque Deposit</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-[#c4d4ec] px-2 py-1 rounded">
            <span className="text-[#1e4676] font-bold text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs text-gray-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Debits</option>
              <option value="active">Active (Success)</option>
              <option value="bounced">Bounced / Reversed</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Beneficiary, A/C, IFSC, UTR, Txn#..."
            className="bg-white border border-[#c4d4ec] rounded px-2.5 py-1 text-xs text-gray-700 w-[240px] pl-7 focus:outline-none focus:border-[#104080]"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1 text-gray-400 hover:text-red-500 font-bold text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards: Dynamic metrics synchronized with active filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 p-3 bg-[#eef3f9] border-b border-[#c4d4ec]">
        <div className="bg-white border border-[#c4d4ec] rounded-xs p-2.5 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Total Float Credited</div>
          <div className="text-base font-extrabold text-[#104080] mt-0.5">
            ₹ {dynamicTotalCredited.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5 truncate" title={filteredSelectedServicer ? `Servicer: [${filteredSelectedServicer.servicer_code}] ${filteredSelectedServicer.name}` : "Total Capital Injected into Servicer Accounts"}>
            {filteredSelectedServicer ? `[${filteredSelectedServicer.servicer_code}] ${filteredSelectedServicer.name}` : "Total Capital Injected into Servicer Accounts"}
          </div>
        </div>

        <div className="bg-white border border-[#c4d4ec] rounded-xs p-2.5 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Total Beneficiary Debited</div>
          <div className="text-base font-extrabold text-rose-600 mt-0.5">
            ₹ {dynamicTotalDebited.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {dynamicDebitCount} {statusFilter === "bounced" ? "Bounced / Reversed Debits" : "Direct Beneficiary Payouts"} Matching Filter
          </div>
        </div>

        <div className="bg-white border border-[#c4d4ec] rounded-xs p-2.5 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Net Available Float</div>
          <div className="text-base font-extrabold text-emerald-600 mt-0.5">
            ₹ {dynamicNetAvailable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {filteredSelectedServicer ? `Active Float for [${filteredSelectedServicer.servicer_code}]` : "Active Remaining Liquid Float in India"}
          </div>
        </div>

        <div className="bg-white border-2 border-amber-400 rounded-xs p-2.5 shadow-2xs bg-amber-50/40">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center justify-between">
            <span>Pending Payouts Queue</span>
            <span className="bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full font-mono text-[9px] font-bold">
              {filteredPendingCount} QUEUED
            </span>
          </div>
          <div className="text-base font-extrabold text-amber-900 mt-0.5">
            ₹ {filteredPendingInr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-amber-800 font-semibold mt-0.5">
            {filteredPendingCount} Booked Beneficiaries Matching Filter
          </div>
        </div>

        <div className="bg-white border border-[#c4d4ec] rounded-xs p-2.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Disbursement Ratio</span>
            <span className="text-xs font-bold text-[#104080]">
              {dynamicDisbursementRatio}%
            </span>
          </div>
          <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-[#104080] h-full transition-all duration-300"
              style={{
                width: `${dynamicDisbursementRatio}%`,
              }}
            />
          </div>
          <div className="text-[10px] text-gray-500 mt-1 flex justify-between">
            <span>₹ {dynamicNetAvailable.toLocaleString("en-IN")} Free</span>
            <span>{dynamicDebitCount} Debits Logged</span>
          </div>
        </div>
      </div>

      {/* Desk View Switcher Tabs */}
      <div className="bg-[#e4ebf5] border-b border-[#c4d4ec] px-3 pt-2 flex items-center justify-between select-none">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveDeskTab("dispatched_ledger")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-t border-t border-x transition-colors cursor-pointer ${
              activeDeskTab === "dispatched_ledger"
                ? "bg-white text-[#104080] border-[#c4d4ec] border-b-white -mb-[1px] shadow-xs"
                : "bg-transparent text-gray-600 border-transparent hover:bg-[#d5dfea] hover:text-[#104080]"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dispatched Debits Ledger</span>
            <span className="bg-blue-100 text-[#104080] border border-blue-200 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
              {records.length}
            </span>
          </button>

          <button
            onClick={() => setActiveDeskTab("pending_queue")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-t border-t border-x transition-colors cursor-pointer ${
              activeDeskTab === "pending_queue"
                ? "bg-white text-[#104080] border-[#c4d4ec] border-b-white -mb-[1px] shadow-xs"
                : "bg-transparent text-gray-600 border-transparent hover:bg-[#d5dfea] hover:text-[#104080]"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Payouts Queue (Booked Orders)</span>
            <span className="bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
              {pendingPayouts.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-gray-600 pb-1 font-semibold flex items-center gap-2">
          {activeDeskTab === "pending_queue" ? (
            <span>
              ⚡ Showing <strong>{filteredPendingPayouts.length}</strong> unpaid beneficiaries booked in UAE waiting for dispatch in India
            </span>
          ) : (
            <span>
              📜 Showing <strong>{filteredRecords.length}</strong> logged debit payout vouchers
            </span>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 overflow-auto custom-scrollbar p-3">
        {activeDeskTab === "pending_queue" ? (
          /* ── VIEW 1: LIVE PENDING PAYOUTS QUEUE DIRECTLY POPULATED BY BOOKED ORDERS ── */
          <div className="border border-[#c4d4ec] rounded-xs overflow-hidden shadow-2xs bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#e4e4e4] border-b border-[#a0a0a0] text-[11px] font-bold text-[#104080] uppercase tracking-wider select-none">
                  <th className="py-2 px-2.5 border-r border-[#c4d4ec]">Order # & Date</th>
                  <th className="py-2 px-2.5 border-r border-[#c4d4ec]">Remitting Party / Client</th>
                  <th className="py-2 px-2.5 border-r border-[#c4d4ec]">Beneficiary Name</th>
                  <th className="py-2 px-2.5 border-r border-[#c4d4ec]">Account Number</th>
                  <th className="py-2 px-2.5 border-r border-[#c4d4ec]">Bank & Branch (IFSC)</th>
                  <th className="py-2 px-2.5 border-r border-[#c4d4ec] text-right">Booked INR Amount</th>
                  <th className="py-2 px-2.5 border-r border-[#c4d4ec] text-center">Assigned Servicer</th>
                  <th className="py-2 px-2.5 border-r border-[#c4d4ec] text-center">Status</th>
                  <th className="py-2 px-2.5 text-center bg-[#f0f4f8]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] text-[12px]">
                {loadingPending ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-500">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#104080] mx-auto mb-2" />
                      Loading live pending payouts queue from Order Entry...
                    </td>
                  </tr>
                ) : filteredPendingPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-500">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      <div className="font-bold text-gray-700">No pending payouts waiting in queue!</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        All unpaid beneficiaries booked in UAE have been dispatched in India.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPendingPayouts.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f6f9fc] transition-colors">
                      {/* Order # & Date */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0]">
                        <div className="font-mono font-bold text-[#104080] text-xs">
                          {item.order_no}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {item.order_date}
                        </div>
                      </td>

                      {/* Remitting Party */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0]">
                        <div className="font-bold text-gray-800">
                          {item.party_name}
                        </div>
                      </td>

                      {/* Beneficiary Name */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0]">
                        <div className="font-bold text-gray-900">
                          {item.beneficiary_name || <span className="text-gray-400 italic">Not Specified</span>}
                        </div>
                      </td>

                      {/* Account Number */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0]">
                        {item.account_number ? (
                          <div className="font-mono font-bold text-gray-800 text-[11px]">
                            {item.account_number}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Cash Payout</span>
                        )}
                      </td>

                      {/* Bank, Branch & IFSC */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0]">
                        <div className="font-semibold text-gray-800">
                          {item.bank_name || "-"}
                        </div>
                        <div className="text-[10px] text-gray-600 flex items-center gap-1">
                          {item.branch_name && <span>{item.branch_name} • </span>}
                          {item.ifsc_code && (
                            <span className="inline-block bg-gray-100 text-gray-700 px-1 py-0.2 rounded font-mono text-[10px] font-bold">
                              {item.ifsc_code}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Booked INR Amount */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0] text-right font-extrabold text-emerald-700 text-sm">
                        ₹ {item.inr_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        {item.paid_amount && item.paid_amount > 0 ? (
                          <div className="text-[9.5px] font-bold text-blue-700">
                            (Paid: ₹ {item.paid_amount.toLocaleString("en-IN")})
                          </div>
                        ) : null}
                      </td>

                      {/* Assigned Servicer */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0] text-center">
                        {item.assigned_servicer ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#eef3f9] text-[#104080] border border-[#c4d4ec]">
                            {item.assigned_servicer}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px] italic">Unassigned</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-2.5 border-r border-[#e2e8f0] text-center">
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-extrabold">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {item.payment_status === "partial" ? "PARTIAL" : "WAITING DISPATCH"}
                        </span>
                      </td>

                      {/* Inline [ Action Payout ] Button */}
                      <td className="py-2 px-2.5 text-center bg-[#f8fafc]">
                        <button
                          onClick={() => handleActionPayout(item)}
                          className="inline-flex items-center gap-1.5 bg-[#104080] hover:bg-[#1a559e] text-white px-3 py-1.5 rounded font-extrabold text-[11px] shadow-sm transition-all cursor-pointer active:scale-95"
                          title={`Action payout for ${item.beneficiary_name} - pre-fills debit entry modal`}
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                          <span>Action Payout</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── VIEW 2: DISPATCHED DEBITS LEDGER ── */
          <div className="border border-[#c4d4ec] rounded-xs overflow-hidden shadow-2xs bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#e4e4e4] border-b border-[#a0a0a0] text-[11px] font-bold text-[#104080] uppercase tracking-wider select-none">
                  <th className="py-2 px-2.5 border-r border-[#c4d4ec]">Txn# & Date</th>
                  <th className="py-2 px-2.5 border-r border-[#c4d4ec]">Servicer / Funding Float</th>
                  <th className="py-2 px-2.5 border-r border-[#c4d4ec]">Beneficiary & Account</th>
                  <th className="py-2 px-2.5 border-r border-[#c4d4ec]">Bank & Branch (IFSC)</th>
                  <th className="py-2 px-2.5 border-r border-[#c4d4ec] text-right">Amount Paid (INR)</th>
                  <th className="py-2 px-2.5 border-r border-[#c4d4ec] text-center">Mode & Bucket</th>
                  <th className="py-2 px-2.5 border-r border-[#c4d4ec]">UTR / Reference</th>
                  <th className="py-2 px-2.5 border-r border-[#c4d4ec] text-center">Status</th>
                  <th className="py-2 px-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] text-[12px]">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-500">
                      <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      No beneficiary payout debit entries found. Click{" "}
                      <button onClick={handleOpenNewEntry} className="text-[#104080] font-bold underline cursor-pointer">
                        + New Debit Entry
                      </button>{" "}
                      to log a payout against servicer float.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item) => {
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-[#f6f9fc] transition-colors ${item.bounced ? "bg-rose-50/40" : ""}`}
                      >
                        {/* Txn Details */}
                        <td className="py-2 px-2.5 border-r border-[#e2e8f0]">
                          <div className="font-mono font-bold text-[#104080] text-xs flex items-center gap-1">
                            {item.txn_no}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {item.entry_date}
                          </div>
                        </td>

                        {/* Servicer */}
                        <td className="py-2 px-2.5 border-r border-[#e2e8f0]">
                          <div className="font-bold text-gray-800">
                            {item.servicer_name}
                          </div>
                          <div className="text-[10px] text-gray-500 flex items-center gap-1">
                            {item.servicer_code && (
                              <span className="font-semibold text-blue-800">[{item.servicer_code}]</span>
                            )}
                            {item.servicer_account_no && (
                              <span className="font-mono text-gray-600">A/C: {item.servicer_account_no}</span>
                            )}
                          </div>
                        </td>

                        {/* Beneficiary & Account */}
                        <td className="py-2 px-2.5 border-r border-[#e2e8f0]">
                          <div className="font-bold text-gray-900">
                            {item.beneficiary_name}
                          </div>
                          {item.account_number ? (
                            <div className="font-mono text-[11px] text-gray-700">
                              A/C: {item.account_number}
                            </div>
                          ) : (
                            <div className="text-[10px] text-gray-400">Cash Handover</div>
                          )}
                        </td>

                        {/* Bank, Branch & IFSC */}
                        <td className="py-2 px-2.5 border-r border-[#e2e8f0]">
                          <div className="font-semibold text-gray-800">
                            {item.bank_name || "-"}
                          </div>
                          <div className="text-[10px] text-gray-600">
                            {item.branch_name && <span>{item.branch_name} </span>}
                            {item.ifsc_code && (
                              <span className="inline-block bg-gray-100 text-gray-700 px-1 py-0.2 rounded font-mono text-[10px]">
                                {item.ifsc_code}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Amount Paid */}
                        <td className="py-2 px-2.5 border-r border-[#e2e8f0] text-right font-extrabold text-emerald-700 text-sm">
                          ₹ {item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Mode & Bucket */}
                        <td className="py-2 px-2.5 border-r border-[#e2e8f0] text-center">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#eef3f9] text-[#104080] border border-[#c4d4ec] uppercase">
                            {item.payment_mode === "bank_transfer" ? "Bank Transfer" : item.payment_mode.toUpperCase()}
                          </span>
                          <div className="text-[9px] text-gray-500 mt-0.5 capitalize">
                            {item.wallet_type === "bank" ? "💳 Bank Float" : item.wallet_type === "cash" ? "💵 Cash Float" : "Direct"}
                          </div>
                        </td>

                        {/* UTR / Reference */}
                        <td className="py-2 px-2.5 border-r border-[#e2e8f0]">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[11px] font-bold text-gray-800 truncate max-w-[150px]" title={item.utr_number}>
                              {item.utr_number}
                            </span>
                            <button
                              onClick={() => handleCopyUtr(item.utr_number)}
                              className="text-gray-400 hover:text-blue-600 p-0.5 cursor-pointer"
                              title="Copy UTR"
                            >
                              {copiedUtr === item.utr_number ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          {item.note && (
                            <div className="text-[10px] text-gray-500 italic truncate max-w-[160px]" title={item.note}>
                              {item.note}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-2 px-2.5 border-r border-[#e2e8f0] text-center">
                          {item.bounced ? (
                            <div>
                              <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded text-[10px] font-extrabold">
                                <AlertTriangle className="w-3 h-3 text-rose-600" /> REVERSED
                              </span>
                              {item.bounced_reason && (
                                <div className="text-[9px] text-rose-600 mt-0.5 truncate max-w-[100px]" title={item.bounced_reason}>
                                  {item.bounced_reason}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-extrabold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> SUCCESS
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setViewDetailsItem(item)}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-2 py-0.5 rounded text-[11px] border border-gray-300 cursor-pointer"
                              title="View Voucher Details"
                            >
                              Voucher
                            </button>
                            {!item.bounced && (
                              <button
                                onClick={() => {
                                  setBounceItem(item);
                                  setBounceReason("Account Closed / Invalid IFSC");
                                  setBounceError("");
                                }}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-semibold px-2 py-0.5 rounded text-[11px] cursor-pointer flex items-center gap-1"
                                title="Mark payout as bounced/reversed"
                              >
                                <RotateCcw className="w-3 h-3" /> Bounce
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 0: ADD FLOAT CREDIT (LIQUIDITY INFLOW) */}
      {isCreditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#104080] shadow-2xl rounded-xs w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#104080] text-white px-3 py-2 flex items-center justify-between select-none">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">💳</span>
                <span className="font-bold text-xs uppercase tracking-wider">Inject Float Credit (Liquidity Inflow)</span>
              </div>
              <button onClick={() => setIsCreditModalOpen(false)} className="text-white hover:text-red-300 font-bold cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddCredit} className="p-4 space-y-3">
              {creditError && (
                <div className="bg-rose-50 border border-rose-300 text-rose-700 px-3 py-1.5 rounded text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{creditError}</span>
                </div>
              )}

              {/* Servicer Selector & Balance preview */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Select Servicer <span className="text-red-500">*</span>:</label>
                <select
                  value={creditServicerId}
                  onChange={(e) => setCreditServicerId(e.target.value)}
                  className="w-full border-2 border-[#104080] rounded px-2.5 py-1.5 text-xs font-bold text-gray-900 bg-white focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">-- Choose Servicer --</option>
                  {servicers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.cif_no || s.servicer_code}) {s.account_no ? `• A/C: ${s.account_no}` : ""}
                    </option>
                  ))}
                </select>

                {activeCreditServicer && (
                  <div className="mt-1 flex items-center justify-between text-[11px] bg-[#f0f4f8] px-2.5 py-1 rounded border border-[#c4d4ec] text-gray-700">
                    <span>💳 Bank Float: <strong className="text-[#104080]">₹{Number(activeCreditServicer.wallet?.bank_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></span>
                    <span>💵 Cash Float: <strong className="text-emerald-700">₹{Number(activeCreditServicer.wallet?.cash_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></span>
                    <span>Total Float: <strong className="text-gray-900">₹{Number(activeCreditServicer.wallet?.total_float || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></span>
                  </div>
                )}
              </div>

              {/* Master Total Credit Amount */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[11px] font-bold text-gray-700">
                    Total Credit Amount (INR) <span className="text-red-500">*</span>:
                  </label>
                  {masterTotal > 0 && (
                    <span className="text-[10px] text-gray-500 font-mono italic">
                      {numberToIndianWords(masterTotal)}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={totalCreditAmount}
                  onChange={(e) => handleTotalAmountChange(e.target.value)}
                  className="w-full border-2 border-[#104080] rounded px-2.5 py-1 text-sm font-extrabold focus:outline-none"
                  required
                />
              </div>

              {/* Target Saved Bank Account */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                  Target Saved Bank Account of Servicer:
                </label>
                <select
                  value={selectedBankAccountId}
                  onChange={(e) => setSelectedBankAccountId(e.target.value)}
                  className="w-full border border-[#c4d4ec] rounded px-2.5 py-1.5 text-xs bg-white text-gray-800 font-semibold focus:outline-none focus:border-[#104080] cursor-pointer"
                >
                  {availableBankAccounts.length > 0 ? (
                    availableBankAccounts.map((acc, idx) => (
                      <option key={idx} value={acc.value}>
                        {acc.label}
                      </option>
                    ))
                  ) : (
                    <option value="other">Other Account / Physical Cash Deposit</option>
                  )}
                </select>
              </div>

              {/* Target Wallet & Transfer Mode */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Target Wallet:</label>
                  <select
                    value={creditWallet}
                    onChange={(e: any) => setCreditWallet(e.target.value)}
                    className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none bg-white font-medium cursor-pointer"
                  >
                    <option value="bank">Bank Wallet (IMPS/RTGS)</option>
                    <option value="cash">Cash / Hand Wallet (CDM)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Transfer Mode:</label>
                  <select
                    value={creditMode}
                    onChange={(e) => setCreditMode(e.target.value)}
                    className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none bg-white font-medium cursor-pointer"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="cdm">CDM Deposit</option>
                    <option value="cash">Cash Handover</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Multi-UTR and Amount Breakdown (Interactive Table) */}
              <div className="border border-[#c4d4ec] rounded p-2.5 bg-[#f8fafc] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#104080] flex items-center gap-1">
                    <span>UTR & Amount Breakdown (Multiple Tranches Supported)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addTrancheRow}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded cursor-pointer transition-colors shadow-2xs"
                  >
                    <Plus className="w-3 h-3" /> + Add UTR / Split
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {creditTranches.map((tranche, idx) => (
                    <div key={tranche.id} className="flex items-center gap-2 bg-white p-1.5 border border-[#e2e8f0] rounded">
                      <span className="text-[10px] font-mono font-bold text-gray-400 w-4 text-center">
                        #{idx + 1}
                      </span>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={tranche.utr}
                          onChange={(e) => updateTranche(tranche.id, "utr", e.target.value)}
                          className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs font-mono uppercase focus:outline-none focus:border-[#104080]"
                        />
                      </div>
                      <div className="w-[140px]">
                        <input
                          type="number"
                          step="0.01"
                          value={tranche.amount}
                          onChange={(e) => updateTranche(tranche.id, "amount", e.target.value)}
                          className="w-full border-2 border-[#104080] rounded px-2 py-1 text-xs font-bold text-right focus:outline-none"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTrancheRow(tranche.id)}
                        disabled={creditTranches.length <= 1}
                        title="Remove row"
                        className="p-1 text-gray-400 hover:text-rose-600 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Live Reconciliation & Match Bar */}
                <div className="pt-2 border-t border-[#e2e8f0] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-semibold">
                      Total Tranches Sum ({creditTranches.length} {creditTranches.length === 1 ? "entry" : "entries"}):
                    </span>
                    <span className="font-extrabold font-mono text-gray-900">
                      ₹{tranchesSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {masterTotal > 0 ? (
                    isBalanced ? (
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2 py-1 rounded">
                        <span className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          Balanced: Tranche sum exactly matches total amount
                        </span>
                        <span className="font-mono">₹{masterTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })} ✓</span>
                      </div>
                    ) : difference > 0 ? (
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-1 rounded">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          Remaining to allocate:
                        </span>
                        <span className="font-mono text-xs">₹{difference.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-300 px-2 py-1 rounded">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          Tranches exceed total by:
                        </span>
                        <span className="font-mono text-xs">₹{Math.abs(difference).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                    )
                  ) : (
                    <div className="text-[11px] text-gray-500 italic bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                      Enter Total Credit Amount above to begin allocation.
                    </div>
                  )}
                </div>
              </div>

              {/* Entry Date & Staff Note */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Entry Date:</label>
                  <FinacleDatePicker value={creditDate} onChange={(e) => setCreditDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Note:</label>
                  <input
                    type="text"
                    value={creditNote}
                    onChange={(e) => setCreditNote(e.target.value)}
                    className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCreditModalOpen(false)}
                  className="bg-[#d4d0c8] hover:bg-[#e4e4e4] px-3 py-1 font-bold text-xs cursor-pointer border border-[#808080]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creditSubmitting || !isBalanced}
                  className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-1.5 font-bold text-xs rounded cursor-pointer shadow-xs transition-colors"
                >
                  {creditSubmitting
                    ? "Injecting Float..."
                    : isBalanced
                    ? `Confirm Float Credit (₹${masterTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })})`
                    : `Sum Must Match Total (Diff: ₹${Math.abs(difference).toLocaleString("en-IN", { minimumFractionDigits: 2 })})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: NEW DEBIT ENTRY (BENEFICIARY PAYOUT) */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#104080] shadow-2xl rounded-xs w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#104080] text-white px-3 py-2 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <span className="text-sm">⚡</span>
                <span className="font-bold text-xs uppercase tracking-wider">
                  Direct Beneficiary Payout & Debit Entry (India Outflow)
                </span>
              </div>
              <button
                onClick={() => setIsEntryModalOpen(false)}
                className="text-white hover:text-red-300 font-bold text-sm px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitDebitEntry} className="p-4 space-y-3.5 max-h-[85vh] overflow-y-auto">
              {formError && (
                <div className="bg-rose-50 border border-rose-300 text-rose-700 px-3 py-1.5 rounded text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Actioned from Live Pending Queue Banner */}
              {actioningPendingItem && (
                <div className="bg-amber-50 border border-amber-300 text-amber-900 px-3 py-2 rounded text-xs flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚡</span>
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        <span>Pre-filled from Booked UAE Order:</span>
                        <span className="font-mono text-[#104080] font-extrabold bg-blue-100/70 border border-blue-200 px-1.5 py-0.2 rounded">
                          {actioningPendingItem.order_no}
                        </span>
                        <span className="text-[11px] text-gray-600 font-semibold">({actioningPendingItem.order_date})</span>
                      </div>
                      <div className="text-[10px] text-gray-700 mt-0.5">
                        Client / Party: <strong>{actioningPendingItem.party_name}</strong> • Receiver #{actioningPendingItem.receiver_index + 1} • Booked INR: ₹ {actioningPendingItem.inr_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider">
                    Live Dispatch Pre-fill
                  </span>
                </div>
              )}

              {/* Step 1: Funding Source & Channel */}
              <div className="border border-[#c4d4ec] p-2.5 rounded-xs space-y-2 bg-[#f8fafc]">
                <div className="text-[11px] font-bold text-[#104080] uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-[#104080]" />
                  1. Funding Source & Servicer Float
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
                    Via Servicer Credit Float (Partner Gateway)
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
                    Direct Company Account (No Servicer)
                  </label>
                </div>

                {channel === "servicer" ? (
                  <div className="space-y-2 pt-2 border-t border-[#e2e8f0]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                              [{s.servicer_code}] {s.name} (Float: ₹ {s.wallet.total_float.toLocaleString("en-IN")})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                          Deduct From Wallet Bucket:
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
                            <span>💳 Bank (₹ {activeServicer?.wallet.bank_balance.toLocaleString("en-IN") || 0})</span>
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
                            <span>💵 Cash (₹ {activeServicer?.wallet.cash_balance.toLocaleString("en-IN") || 0})</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* From Account of Servicer */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                        From Account (Servicer Funding Source A/C):
                      </label>
                      <select
                        value={debitFromAccountId}
                        onChange={(e) => setDebitFromAccountId(e.target.value)}
                        className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#104080] bg-white font-medium cursor-pointer"
                      >
                        {availableDebitBankAccounts.map((acc, idx) => (
                          <option key={idx} value={acc.value}>
                            {acc.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-[#e2e8f0] text-xs text-gray-600 bg-emerald-50 border border-emerald-200 p-2 rounded">
                    ℹ️ Direct Settlement: 0% servicer commission. Funds disbursed directly by company treasury in India.
                  </div>
                )}
              </div>

              {/* Step 2: Beneficiary Details (Reordered as requested: Name -> A/C -> IFSC [autofetch] -> Bank -> Branch) */}
              <div className="border border-[#c4d4ec] p-2.5 rounded-xs space-y-2 bg-white">
                <div className="text-[11px] font-bold text-[#104080] uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#104080]" />
                    2. Beneficiary Details (India Recipient)
                  </span>
                  {ifscStatus === "loading" && (
                    <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Verifying IFSC...
                    </span>
                  )}
                  {ifscStatus === "success" && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> IFSC Verified
                    </span>
                  )}
                  {ifscStatus === "error" && (
                    <span className="text-[10px] text-rose-600 font-semibold">
                      ⚠️ {ifscError || "Invalid IFSC"}
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  {/* 1. Beneficiary Full Name with Order Entry Suggestions */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[11px] font-bold text-gray-700">
                        Beneficiary Full Name <span className="text-red-500">*</span>:
                      </label>
                      {savedBeneficiaries.length > 0 && (
                        <span className="text-[10px] text-blue-700 font-semibold">
                          💡 Suggesting from {savedBeneficiaries.length} Order Entry Accounts
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      list="payout-beneficiary-name-suggestions"
                      autoComplete="off"
                      value={beneficiaryName}
                      onChange={(e) => handleBeneficiaryNameChange(e.target.value)}
                      className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:border-[#104080]"
                      required
                    />
                    <datalist id="payout-beneficiary-name-suggestions">
                      {uniqueBeneficiaryNames.map((b, idx) => (
                        <option
                          key={`name-${idx}-${b.account_number}`}
                          value={b.client_name}
                          label={`${b.account_number ? `A/C: ${b.account_number}` : ""} ${b.bank_name ? `• ${b.bank_name}` : ""}`}
                        >
                          {b.account_number ? `A/C: ${b.account_number}` : ""} {b.bank_name ? `• ${b.bank_name}` : ""}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  {/* Row: 2. Account Number & 3. IFSC Code */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* 2. Account Number with Order Entry Suggestions */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                        Account Number:
                      </label>
                      <input
                        type="text"
                        list="payout-beneficiary-acc-suggestions"
                        autoComplete="off"
                        value={beneficiaryAccount}
                        onChange={(e) => handleBeneficiaryAccountChange(e.target.value)}
                        className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-[#104080]"
                      />
                      <datalist id="payout-beneficiary-acc-suggestions">
                        {uniqueBeneficiaryAccounts.map((b, idx) => (
                          <option
                            key={`acc-${idx}-${b.account_number}`}
                            value={b.account_number}
                            label={`${b.client_name || ""} ${b.bank_name ? `• ${b.bank_name}` : ""}`}
                          >
                            {b.client_name || ""} {b.bank_name ? `• ${b.bank_name}` : ""}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    {/* 3. IFSC Code */}
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[11px] font-semibold text-gray-700">
                          IFSC Code:
                        </label>
                        {ifscStatus === "success" && (
                          <span className="text-[10px] text-emerald-700 font-bold">✓ Autofetched</span>
                        )}
                      </div>
                      <input
                        type="text"
                        maxLength={11}
                        value={beneficiaryIfsc}
                        onChange={(e) => setBeneficiaryIfsc(e.target.value.toUpperCase())}
                        className={`w-full border ${ifscStatus === "error" ? "border-rose-400" : ifscStatus === "success" ? "border-emerald-500" : "border-[#c4d4ec]"} rounded px-2 py-1 text-xs font-mono uppercase focus:outline-none focus:border-[#104080]`}
                      />
                    </div>
                  </div>

                  {/* Row: 4. Bank Name & 5. Branch Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* 4. Bank Name */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                        Bank Name:
                      </label>
                      <input
                        type="text"
                        value={beneficiaryBank}
                        onChange={(e) => setBeneficiaryBank(e.target.value)}
                        className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#104080] bg-gray-50/50"
                      />
                    </div>

                    {/* 5. Branch Name */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                        Branch Name:
                      </label>
                      <input
                        type="text"
                        value={beneficiaryBranch}
                        onChange={(e) => setBeneficiaryBranch(e.target.value)}
                        className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#104080] bg-gray-50/50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Payment & Settlement Details */}
              <div className="border border-[#c4d4ec] p-2.5 rounded-xs space-y-2 bg-[#f8fafc]">
                <div className="text-[11px] font-bold text-[#104080] uppercase tracking-wider flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-[#104080]" />
                  3. Payout Amount & Bank Reference
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                      Payout Amount (INR) <span className="text-red-500">*</span>:
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="w-full border-2 border-[#104080] rounded px-2.5 py-1 text-sm font-extrabold text-gray-900 focus:outline-none"
                      required
                    />
                    {amountNum > 0 && (
                      <div className="text-[10px] text-gray-600 mt-1 italic font-semibold">
                        {numberToIndianWords(amountNum)}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                      Entry Date:
                    </label>
                    <FinacleDatePicker value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                      Payment Mode:
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#104080]"
                    >
                      <option value="bank_transfer">Bank Transfer (IMPS / NEFT / RTGS)</option>
                      <option value="cdm">CDM Cash Deposit Machine</option>
                      <option value="upi">UPI / QR Transfer</option>
                      <option value="cash">Direct Cash Handover</option>
                      <option value="cheque">Cheque Deposit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                      Bank UTR / Transaction Reference <span className="text-red-500">*</span>:
                    </label>
                    <input
                      type="text"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs font-mono uppercase focus:outline-none focus:border-[#104080]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                    Note:
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#104080]"
                  />
                </div>

                {channel === "servicer" && amountNum > 0 && (
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-gray-200 font-bold text-gray-700">
                    <span>Servicer Commission Accrual ({commissionRate}%):</span>
                    <span className="text-emerald-700">
                      ₹ {commissionEarned.toLocaleString("en-IN", { minimumFractionDigits: 2 })} (credited to servicer)
                    </span>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
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
                  {submitting ? "Processing..." : "Confirm & Post Debit Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VOUCHER DETAILS MODAL */}
      {viewDetailsItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#104080] shadow-2xl rounded-xs w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#104080] text-white px-3 py-2 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <span className="text-sm">📄</span>
                <span className="font-bold text-xs uppercase tracking-wider">
                  Beneficiary Payout Voucher — {viewDetailsItem.txn_no}
                </span>
              </div>
              <button
                onClick={() => setViewDetailsItem(null)}
                className="text-white hover:text-red-300 font-bold text-sm px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="bg-[#f0f4f8] p-3 rounded border border-[#c4d4ec] space-y-2">
                <div className="flex justify-between items-center border-b border-[#c4d4ec] pb-1.5">
                  <span className="text-gray-600 font-semibold">Transaction Number:</span>
                  <span className="font-mono font-bold text-[#104080]">{viewDetailsItem.txn_no}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#c4d4ec] pb-1.5">
                  <span className="text-gray-600 font-semibold">Entry Date:</span>
                  <span className="font-bold text-gray-800">{viewDetailsItem.entry_date}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#c4d4ec] pb-1.5">
                  <span className="text-gray-600 font-semibold">Funding Servicer:</span>
                  <span className="font-bold text-gray-800">{viewDetailsItem.servicer_name} ({viewDetailsItem.servicer_code || "Direct"})</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#c4d4ec] pb-1.5">
                  <span className="text-gray-600 font-semibold">Beneficiary Name:</span>
                  <span className="font-bold text-gray-900">{viewDetailsItem.beneficiary_name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#c4d4ec] pb-1.5">
                  <span className="text-gray-600 font-semibold">Bank & Branch:</span>
                  <span className="text-gray-800 font-semibold">
                    {viewDetailsItem.bank_name || "-"} {viewDetailsItem.branch_name ? `(${viewDetailsItem.branch_name})` : ""}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-[#c4d4ec] pb-1.5">
                  <span className="text-gray-600 font-semibold">Account Number:</span>
                  <span className="font-mono text-gray-900 font-bold">{viewDetailsItem.account_number || "Cash Handover"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#c4d4ec] pb-1.5">
                  <span className="text-gray-600 font-semibold">IFSC Code:</span>
                  <span className="font-mono font-bold text-blue-800">{viewDetailsItem.ifsc_code || "-"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#c4d4ec] pb-1.5">
                  <span className="text-gray-600 font-semibold">Disbursed Amount:</span>
                  <span className="font-extrabold text-emerald-700 text-sm">
                    ₹ {viewDetailsItem.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-[11px] text-gray-600 italic">
                  {numberToIndianWords(viewDetailsItem.amount)}
                </div>
                <div className="flex justify-between items-center border-b border-[#c4d4ec] pb-1.5 pt-1">
                  <span className="text-gray-600 font-semibold">Bank UTR / Reference:</span>
                  <span className="font-mono font-bold text-gray-900">{viewDetailsItem.utr_number}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#c4d4ec] pb-1.5">
                  <span className="text-gray-600 font-semibold">Payment Mode:</span>
                  <span className="font-bold uppercase text-gray-800">{viewDetailsItem.payment_mode}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#c4d4ec] pb-1.5">
                  <span className="text-gray-600 font-semibold">Status:</span>
                  <span className={`font-bold ${viewDetailsItem.bounced ? "text-rose-600" : "text-emerald-700"}`}>
                    {viewDetailsItem.bounced ? `BOUNCED: ${viewDetailsItem.bounced_reason}` : "COMPLETED"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-semibold">Logged By:</span>
                  <span className="text-gray-700">{viewDetailsItem.created_by_name} ({new Date(viewDetailsItem.created_at).toLocaleString()})</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setViewDetailsItem(null)}
                  className="bg-[#104080] text-white px-4 py-1 text-xs font-bold rounded cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: BOUNCE / REVERSAL MODAL */}
      {bounceItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-rose-700 shadow-2xl rounded-xs w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-700 text-white px-3 py-2 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-200" />
                <span className="font-bold text-xs uppercase tracking-wider">
                  Reverse Payout Debit — {bounceItem.txn_no}
                </span>
              </div>
              <button
                onClick={() => setBounceItem(null)}
                className="text-white hover:text-rose-200 font-bold text-sm px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              {bounceError && (
                <div className="bg-rose-50 border border-rose-300 text-rose-700 px-3 py-1.5 rounded text-xs">
                  {bounceError}
                </div>
              )}

              <p className="text-gray-700">
                Are you sure you want to mark this payout of{" "}
                <strong className="text-rose-700">₹ {bounceItem.amount.toLocaleString("en-IN")}</strong> to{" "}
                <strong>{bounceItem.beneficiary_name}</strong> (UTR: {bounceItem.utr_number}) as bounced/reversed?
              </p>

              <div className="bg-amber-50 border border-amber-200 p-2 rounded text-[11px] text-amber-900">
                ⚠️ Reversing this payout will restore ₹ {bounceItem.amount.toLocaleString("en-IN")} back to{" "}
                <strong>{bounceItem.servicer_name}</strong>'s available float.
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Reason for Reversal / Bounce:
                </label>
                <select
                  value={bounceReason}
                  onChange={(e) => setBounceReason(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-rose-700"
                >
                  <option value="Account Closed / Invalid IFSC">Account Closed / Invalid IFSC</option>
                  <option value="UTR Rejected by Beneficiary Bank">UTR Rejected by Beneficiary Bank</option>
                  <option value="Duplicate or Erroneous Entry">Duplicate or Erroneous Entry</option>
                  <option value="Customer Cancelled Payout">Customer Cancelled Payout</option>
                  <option value="Other Bank Rejection">Other Bank Rejection</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setBounceItem(null)}
                  className="bg-[#d4d0c8] hover:bg-[#e4e4e4] px-4 py-1 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBounce}
                  disabled={bounceSubmitting}
                  className="bg-rose-700 hover:bg-rose-800 text-white px-4 py-1 text-xs font-bold rounded shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {bounceSubmitting ? "Reversing..." : "Confirm & Reverse Payout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 4: INTER-SERVICER WORKING FLOAT TRANSFER */}
      {isInterTransferOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#104080] shadow-2xl rounded-xs w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#104080] text-white px-3 py-2 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <span className="text-base">⇄</span>
                <span className="font-bold text-xs uppercase tracking-wider">
                  Inter-Servicer Working Float Transfer (Direct Rebalancing)
                </span>
              </div>
              <button
                onClick={() => setIsInterTransferOpen(false)}
                className="text-white hover:text-red-300 font-bold text-sm px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleInterTransferSubmit} className="p-4 space-y-3 text-xs">
              {transferError && (
                <div className="bg-rose-50 border border-rose-300 text-rose-700 px-3 py-1.5 rounded text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{transferError}</span>
                </div>
              )}

              <div className="bg-blue-50/70 border border-blue-200 text-[#104080] p-2.5 rounded text-[11px] leading-relaxed">
                ℹ️ <strong>Direct Float Rebalancing:</strong> Moves liquid working float directly from an excess servicer to a deficit servicer in a single atomic entry. No external withdrawal or deposit required.
              </div>

              {/* Source & Destination Servicers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Source Servicer (Debit) */}
                <div className="border border-rose-200 bg-rose-50/30 p-2.5 rounded-xs space-y-2">
                  <label className="block text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                    From Servicer (Source / Debit):
                  </label>
                  <select
                    value={transferFromId}
                    onChange={(e) => setTransferFromId(e.target.value)}
                    className="w-full border border-rose-300 rounded px-2 py-1 text-xs bg-white text-gray-800 font-semibold focus:outline-none cursor-pointer"
                    required
                  >
                    {servicers.map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.servicer_code}] {s.name}
                      </option>
                    ))}
                  </select>

                  {/* From Wallet Bucket */}
                  <div>
                    <label className="block text-[10.5px] font-semibold text-gray-600 mb-0.5">Deduct From Bucket:</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 cursor-pointer text-[11px] font-semibold text-gray-800">
                        <input
                          type="radio"
                          name="fromWallet"
                          value="bank"
                          checked={transferFromWallet === "bank"}
                          onChange={() => setTransferFromWallet("bank")}
                          className="accent-[#104080]"
                        />
                        <span>💳 Bank Float</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer text-[11px] font-semibold text-gray-800">
                        <input
                          type="radio"
                          name="fromWallet"
                          value="cash"
                          checked={transferFromWallet === "cash"}
                          onChange={() => setTransferFromWallet("cash")}
                          className="accent-[#104080]"
                        />
                        <span>💵 Cash Float</span>
                      </label>
                    </div>
                  </div>

                  {/* Live Available Float */}
                  <div className="pt-1.5 border-t border-rose-200/60 text-[11px] flex items-center justify-between">
                    <span className="text-gray-600 font-medium">Available Float:</span>
                    <span className="font-extrabold font-mono text-[#104080]">
                      ₹ {sourceAvailable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* 2. Destination Servicer (Credit) */}
                <div className="border border-emerald-200 bg-emerald-50/30 p-2.5 rounded-xs space-y-2">
                  <label className="block text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    To Servicer (Target / Credit):
                  </label>
                  <select
                    value={transferToId}
                    onChange={(e) => setTransferToId(e.target.value)}
                    className="w-full border border-emerald-300 rounded px-2 py-1 text-xs bg-white text-gray-800 font-semibold focus:outline-none cursor-pointer"
                    required
                  >
                    {servicers
                      .filter((s) => String(s.id) !== String(transferFromId))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          [{s.servicer_code}] {s.name}
                        </option>
                      ))}
                  </select>

                  {/* To Wallet Bucket */}
                  <div>
                    <label className="block text-[10.5px] font-semibold text-gray-600 mb-0.5">Credit Into Bucket:</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 cursor-pointer text-[11px] font-semibold text-gray-800">
                        <input
                          type="radio"
                          name="toWallet"
                          value="bank"
                          checked={transferToWallet === "bank"}
                          onChange={() => setTransferToWallet("bank")}
                          className="accent-[#104080]"
                        />
                        <span>💳 Bank Float</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer text-[11px] font-semibold text-gray-800">
                        <input
                          type="radio"
                          name="toWallet"
                          value="cash"
                          checked={transferToWallet === "cash"}
                          onChange={() => setTransferToWallet("cash")}
                          className="accent-[#104080]"
                        />
                        <span>💵 Cash Float</span>
                      </label>
                    </div>
                  </div>

                  {/* Current Target Float */}
                  <div className="pt-1.5 border-t border-emerald-200/60 text-[11px] flex items-center justify-between">
                    <span className="text-gray-600 font-medium">Current Float:</span>
                    <span className="font-extrabold font-mono text-emerald-700">
                      ₹ {targetCurrent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount, UTR, Date, Note */}
              <div className="border border-[#c4d4ec] p-2.5 rounded-xs space-y-2 bg-[#f8fafc]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                      Transfer Amount (INR) <span className="text-red-500">*</span>:
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full border-2 border-[#104080] rounded px-2.5 py-1 text-sm font-extrabold text-gray-900 focus:outline-none"
                      required
                    />
                    {transferAmountNum > 0 && (
                      <div className="text-[10px] text-gray-600 mt-1 italic font-semibold">
                        {numberToIndianWords(transferAmountNum)}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                      Bank UTR / IMPS Reference:
                    </label>
                    <input
                      type="text"
                      value={transferUtr}
                      onChange={(e) => setTransferUtr(e.target.value)}
                      className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs font-mono uppercase focus:outline-none focus:border-[#104080]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                      Transfer Date:
                    </label>
                    <FinacleDatePicker value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                      Note:
                    </label>
                    <input
                      type="text"
                      value={transferNote}
                      onChange={(e) => setTransferNote(e.target.value)}
                      className="w-full border border-[#c4d4ec] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#104080]"
                    />
                  </div>
                </div>

                {/* Real-time Float Impact Preview */}
                {transferAmountNum > 0 && (
                  <div className="bg-white border border-[#c4d4ec] p-2.5 rounded text-[11px] space-y-1.5 mt-1">
                    <div className="font-bold text-[#104080] text-[10.5px] uppercase tracking-wider flex items-center gap-1">
                      <span>⚡</span>
                      <span>Live Rebalance Impact Preview:</span>
                    </div>
                    <div className="flex items-center justify-between text-rose-700 font-semibold bg-rose-50/50 p-1 rounded">
                      <span>{fromServicerObj?.name || "Source"}:</span>
                      <span className="font-mono">
                        ₹ {sourceAvailable.toLocaleString("en-IN", { minimumFractionDigits: 2 })} ➔ ₹ {Math.max(0, sourceAvailable - transferAmountNum).toLocaleString("en-IN", { minimumFractionDigits: 2 })} (-₹{transferAmountNum.toLocaleString("en-IN")})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-700 font-semibold bg-emerald-50/50 p-1 rounded">
                      <span>{toServicerObj?.name || "Target"}:</span>
                      <span className="font-mono">
                        ₹ {targetCurrent.toLocaleString("en-IN", { minimumFractionDigits: 2 })} ➔ ₹ {(targetCurrent + transferAmountNum).toLocaleString("en-IN", { minimumFractionDigits: 2 })} (+₹{transferAmountNum.toLocaleString("en-IN")})
                      </span>
                    </div>
                    <div className="pt-1 border-t border-gray-100 flex items-center justify-between text-gray-600 font-bold text-[10px]">
                      <span>Net Company Float Variance:</span>
                      <span className="text-emerald-700 font-mono">₹ 0.00 (Balanced ✓)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsInterTransferOpen(false)}
                  className="bg-[#d4d0c8] hover:bg-[#e4e4e4] border border-[#808080] px-4 py-1 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferSubmitting || transferAmountNum <= 0 || transferAmountNum > sourceAvailable || transferFromId === transferToId}
                  className="bg-[#104080] hover:bg-[#1a559e] text-white px-5 py-1.5 text-xs font-bold rounded shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  {transferSubmitting ? "Executing Transfer..." : "Confirm Inter-Servicer Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
