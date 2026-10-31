import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import { resolveAccountScheme } from "../utils/schemeUtils";
import {
  Search,
  Landmark,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  X
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import FinacleSelect from "./FinacleSelect";
import FinacleDatePicker from "./FinacleDatePicker";
import Loader from "./Loader";

interface AccountRecord {
  id: string | number;
  party_id?: number | string | null;
  cif_no?: string;
  name: string;
  phone?: string;
  city?: string;
  branch?: "INDIA" | "UAE" | string;
  account_no: string;
  ifsc_code?: string;
  account_type?: string;
  sanctioned_limit?: number | string;
  initial_deposit?: number | string;
  opening_date?: string;
  status?: string;
  created_at?: string;
  servicer_code?: string;
  wallet?: {
    bank_balance?: number;
    cash_balance?: number;
    total_float?: number;
  };
}

interface LedgerEntry {
  id: string | number;
  txn_no: string;
  entry_date: string;
  value_date?: string;
  narration: string;
  ref_no?: string;
  utr_number?: string;
  order_no?: string;
  beneficiary_name?: string;
  payment_mode?: string;
  txn_type: string;
  direction: "in" | "out" | "credit" | "debit";
  debit: number;
  credit: number;
  running_balance: number;
  status?: string;
}

interface AccountLedgerScreenProps {
  initialAccountNo?: string;
  onNavigateToAccounts?: () => void;
}

const SCHEME_CONFIG: Record<string, { code: string; label: string; badgeClass: string }> = {
  SAVINGS: { code: "1020", label: "Savings Account (SBA)", badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300" },
  SALARY: { code: "1050", label: "Salary Account (SAL)", badgeClass: "bg-teal-50 text-teal-800 border-teal-300" },
  CURRENT: { code: "1030", label: "Current Account (CAA)", badgeClass: "bg-blue-50 text-blue-800 border-blue-300" },
  CORPORATE_SINGLE: { code: "1060", label: "Corporate Single (CAP-S)", badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-300" },
  CORPORATE_JOINT: { code: "1070", label: "Corporate Joint (CAP-J)", badgeClass: "bg-violet-50 text-violet-800 border-violet-300" },
  BORROWED: { code: "1040", label: "Overdraft / Loan (ODA)", badgeClass: "bg-rose-50 text-rose-800 border-rose-300" },
  PROFIT: { code: "2010", label: "Profit Account (PFT)", badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300" },
  EXPENSE: { code: "2020", label: "Expense Account (EXP)", badgeClass: "bg-amber-50 text-amber-800 border-amber-300" },
  SERVICER: { code: "1010", label: "Servicer Float (SRV)", badgeClass: "bg-cyan-50 text-cyan-800 border-cyan-300" },
};

export default function AccountLedgerScreen({ initialAccountNo, onNavigateToAccounts }: AccountLedgerScreenProps) {
  // Accounts state
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedAccountNo, setSelectedAccountNo] = useState<string>(initialAccountNo || "");
  const [activeAccount, setActiveAccount] = useState<AccountRecord | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Criteria Filters (Dates)
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Ledger Transactions state
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [rawTransactions, setRawTransactions] = useState<any[]>([]);
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState("");
  const [ledgerDirectionFilter, setLedgerDirectionFilter] = useState<"all" | "credit" | "debit">("all");
  const [copiedAccNo, setCopiedAccNo] = useState<string | null>(null);

  // Pagination in Ledger View
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load account transactions from backend
  const loadAccountTransactions = async (acc: AccountRecord, from?: string, to?: string) => {
    setLoadingLedger(true);
    try {
      const res = await api.get("/payouts/statement", {
        params: {
          servicer_id: acc.id,
          from_date: from || undefined,
          to_date: to || undefined,
        },
      });
      setRawTransactions(res.data?.transactions || []);
    } catch (err) {
      console.error("Failed to load account ledger statement:", err);
      setRawTransactions([]);
    } finally {
      setLoadingLedger(false);
    }
  };

  // Load All Accounts on mount & auto-select initial or first account
  useEffect(() => {
    let isMounted = true;
    const fetchAccounts = async () => {
      setLoadingAccounts(true);
      try {
        const res = await api.get("/payouts/servicers");
        const list: AccountRecord[] = res.data?.servicers || [];
        if (!isMounted) return;
        setAccounts(list);

        let target: AccountRecord | null = null;
        if (initialAccountNo) {
          target = list.find((a) => a.account_no === initialAccountNo) || null;
        }

        if (target) {
          setSelectedAccountNo(target.account_no);
          setIsTransitioning(true);
          try {
            const statementRes = await api.get("/payouts/statement", {
              params: {
                servicer_id: target.id,
                from_date: fromDate || undefined,
                to_date: toDate || undefined,
              },
            });
            if (!isMounted) return;
            setRawTransactions(statementRes.data?.transactions || []);
            setActiveAccount(target);
          } catch (fetchErr) {
            console.error("Failed to load statement for initial account:", fetchErr);
            if (!isMounted) return;
            setActiveAccount(target);
          } finally {
            if (isMounted) setIsTransitioning(false);
          }
        } else {
          setSelectedAccountNo("");
          setActiveAccount(null);
          setRawTransactions([]);
        }
      } catch (err) {
        console.error("Failed to fetch accounts:", err);
      } finally {
        if (isMounted) setLoadingAccounts(false);
      }
    };

    fetchAccounts();
    return () => {
      isMounted = false;
    };
  }, [initialAccountNo]);

  // Handle switching account from dropdown or center card with loader transition
  const handleSelectAccount = async (accNo: string) => {
    setSelectedAccountNo(accNo);
    const target = accounts.find((a) => a.account_no === accNo) || null;
    if (!target) {
      setActiveAccount(null);
      setRawTransactions([]);
      return;
    }

    setIsTransitioning(true);
    setCurrentPage(1);
    try {
      const [statementRes] = await Promise.all([
        api.get("/payouts/statement", {
          params: {
            servicer_id: target.id,
            from_date: fromDate || undefined,
            to_date: toDate || undefined,
          },
        }).catch((err) => {
          console.error("Failed to load account ledger statement:", err);
          return { data: { transactions: [] } };
        }),
        new Promise((resolve) => setTimeout(resolve, 450))
      ]);
      setRawTransactions(statementRes.data?.transactions || []);
      setActiveAccount(target);
    } finally {
      setIsTransitioning(false);
    }
  };

  // Handle applying date filter
  const handleFetchTransactions = () => {
    if (activeAccount) {
      setCurrentPage(1);
      loadAccountTransactions(activeAccount, fromDate, toDate);
    }
  };

  // Build Chronological Ledger Entries with Running Balance
  const computedLedger = useMemo(() => {
    if (!activeAccount) return [];

    const entries: LedgerEntry[] = [];

    // 1. Genesis / Account Opening Entry
    const openDeposit = Number(activeAccount.initial_deposit || 0);
    const sanctionLimit = Number(activeAccount.sanctioned_limit || 0);
    const isOverdraft = resolveAccountScheme(activeAccount.account_type, activeAccount.account_no) === "BORROWED";

    const initialBal = isOverdraft ? sanctionLimit : openDeposit;
    const openDate = activeAccount.opening_date || (activeAccount.created_at ? activeAccount.created_at.slice(0, 10) : "2026-01-01");

    entries.push({
      id: "genesis-0",
      txn_no: `GEN-${activeAccount.account_no.slice(-6)}`,
      entry_date: openDate,
      value_date: openDate,
      narration: isOverdraft
        ? "SANCTIONED OVERDRAFT LIMIT INITIAL COMMITMENT"
        : "ACCOUNT OPENING INITIAL FLOAT / SEED DEPOSIT",
      ref_no: activeAccount.cif_no || "FIN-GENESIS",
      utr_number: "CORE-SYS-INIT",
      txn_type: isOverdraft ? "OVERDRAFT_SANCTION" : "SEED_DEPOSIT",
      direction: "credit",
      debit: 0,
      credit: initialBal,
      running_balance: initialBal,
      status: "POSTED"
    });

    // 2. Map backend statement transactions
    let currentRunningBal = initialBal;

    // Sort transactions chronologically
    const sortedTxns = [...rawTransactions].sort((a, b) => {
      const dateA = new Date(a.entry_date || a.created_at).getTime();
      const dateB = new Date(b.entry_date || b.created_at).getTime();
      return dateA - dateB;
    });

    sortedTxns.forEach((t, idx) => {
      const amt = Number(t.amount || 0);
      const isCredit = t.direction === "in" || t.direction === "credit";
      const debit = isCredit ? 0 : amt;
      const credit = isCredit ? amt : 0;

      currentRunningBal = currentRunningBal + credit - debit;

      entries.push({
        id: t.id || `txn-${idx}`,
        txn_no: t.txn_no || `TXN${String(idx + 1).padStart(6, "0")}`,
        entry_date: t.entry_date || (t.created_at ? t.created_at.slice(0, 10) : "-"),
        value_date: t.value_date || t.entry_date,
        narration: t.note || (t.beneficiary_name ? `Payout Beneficiary: ${t.beneficiary_name}` : (t.txn_type ? t.txn_type.replace(/_/g, " ").toUpperCase() : "GENERAL ENTRY")),
        ref_no: t.order_no || "-",
        utr_number: t.utr_number || "-",
        beneficiary_name: t.beneficiary_name,
        payment_mode: t.payment_mode || t.wallet_type || "NEFT/RTGS",
        txn_type: t.txn_type || (isCredit ? "FLOAT_TOPUP" : "PAYOUT_DEBIT"),
        direction: isCredit ? "credit" : "debit",
        debit,
        credit,
        running_balance: currentRunningBal,
        status: t.bounced ? "BOUNCED" : (t.status || "POSTED")
      });
    });

    return entries;
  }, [activeAccount, rawTransactions]);

  // Filtered Ledger Entries
  const filteredLedger = useMemo(() => {
    return computedLedger.filter((entry) => {
      // Direction filter
      if (ledgerDirectionFilter === "credit" && entry.credit === 0) return false;
      if (ledgerDirectionFilter === "debit" && entry.debit === 0) return false;

      // In-ledger search query
      if (ledgerSearchQuery.trim()) {
        const q = ledgerSearchQuery.toLowerCase().trim();
        const txnNo = (entry.txn_no || "").toLowerCase();
        const narration = (entry.narration || "").toLowerCase();
        const utr = (entry.utr_number || "").toLowerCase();
        const refNo = (entry.ref_no || "").toLowerCase();
        const mode = (entry.payment_mode || "").toLowerCase();
        return txnNo.includes(q) || narration.includes(q) || utr.includes(q) || refNo.includes(q) || mode.includes(q);
      }

      return true;
    });
  }, [computedLedger, ledgerDirectionFilter, ledgerSearchQuery]);

  // Pagination for Ledger
  const totalPages = Math.max(1, Math.ceil(filteredLedger.length / pageSize));
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLedger.slice(start, start + pageSize);
  }, [filteredLedger, currentPage, pageSize]);

  const startRecord = filteredLedger.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, filteredLedger.length);

  // Financial Ledger Totals
  const ledgerMetrics = useMemo(() => {
    const totalCredits = computedLedger.reduce((sum, e) => sum + e.credit, 0);
    const totalDebits = computedLedger.reduce((sum, e) => sum + e.debit, 0);
    const finalBalance = computedLedger.length > 0 ? computedLedger[computedLedger.length - 1].running_balance : 0;
    return {
      totalCredits,
      totalDebits,
      finalBalance,
      totalEntries: computedLedger.length
    };
  }, [computedLedger]);

  const handleCopyAcc = (accNo: string) => {
    navigator.clipboard.writeText(accNo);
    setCopiedAccNo(accNo);
    setTimeout(() => setCopiedAccNo(null), 1800);
  };

  // Export Ledger to Excel
  const handleExportExcel = () => {
    if (!activeAccount || filteredLedger.length === 0) return;
    const isUae = activeAccount.branch === "UAE";
    const ccy = isUae ? "AED" : "INR";

    const rows = filteredLedger.map((e, idx) => ({
      "Sl. No": idx + 1,
      "Value Date": e.entry_date,
      "Transaction ID": e.txn_no,
      "UTR / Ref No": e.utr_number || "-",
      "Particulars / Narration": e.narration,
      "Mode / Channel": e.payment_mode || "-",
      [`Debit (${ccy})`]: e.debit > 0 ? e.debit : "-",
      [`Credit (${ccy})`]: e.credit > 0 ? e.credit : "-",
      [`Balance (${ccy})`]: e.running_balance,
      "Status": e.status || "POSTED"
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Account_Ledger");
    XLSX.writeFile(workbook, `Finacle_Ledger_${activeAccount.account_no.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Export Ledger to PDF
  const handleExportPdf = () => {
    if (!activeAccount || filteredLedger.length === 0) return;
    const doc = new jsPDF("landscape");
    const isUae = activeAccount.branch === "UAE";
    const ccy = isUae ? "AED" : "INR";

    doc.setFontSize(14);
    doc.setTextColor(16, 64, 128); // Finacle Blue
    doc.text("FINACLE CORE BANKING — ACCOUNT STATEMENT & TRANSACTION LEDGER", 14, 15);

    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.text(`Account No: ${activeAccount.account_no} | Legal Title: ${activeAccount.name} | CIF: ${activeAccount.cif_no || "N/A"}`, 14, 21);
    doc.text(`Branch: ${activeAccount.branch === "UAE" ? "Dubai Regional (AED)" : "India Clearing (INR)"} | Currency: ${ccy} | Statement Date: ${new Date().toLocaleDateString()}`, 14, 26);

    const tableRows = filteredLedger.map((e, idx) => [
      idx + 1,
      e.entry_date,
      e.txn_no,
      e.utr_number || "-",
      e.narration,
      e.payment_mode || "-",
      e.debit > 0 ? Number(e.debit).toLocaleString() : "-",
      e.credit > 0 ? Number(e.credit).toLocaleString() : "-",
      Number(e.running_balance).toLocaleString(),
      e.status || "POSTED"
    ]);

    autoTable(doc, {
      startY: 30,
      head: [
        [
          "#",
          "Date",
          "Txn Ref",
          "UTR No",
          "Particulars / Narration",
          "Mode",
          `Debit (${ccy})`,
          `Credit (${ccy})`,
          `Balance (${ccy})`,
          "Status"
        ]
      ],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [16, 64, 128], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(`Finacle_Statement_${activeAccount.account_no.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const isUae = activeAccount?.branch === "UAE";
  const currencySym = isUae ? "AED" : "₹";
  const schemeKey = resolveAccountScheme(activeAccount?.account_type, activeAccount?.account_no);
  const schemeInfo = SCHEME_CONFIG[schemeKey] || {
    code: "1000",
    label: schemeKey || "General Ledger",
    badgeClass: "bg-gray-100 text-gray-800 border-gray-300"
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden text-xs select-none">
      {/* 1. Finacle Title Bar (Header Only) */}
      <div className="bg-white px-4 md:px-6 py-2.5 border-b border-gray-200 flex items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div>
          <h1 className="font-bold text-black text-sm leading-none uppercase tracking-wide">
            Account Statement (ACLI)
          </h1>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">
            Passbook Statement &amp; Transaction Audit
          </p>
        </div>
      </div>

      {isTransitioning ? (
        /* Loader Transition Screen before displaying statement */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50">
          <div className="bg-white border border-[#c4d4ec] rounded-xl p-8 max-w-md w-full shadow-sm flex flex-col items-center">
            <Loader />
            <h3 className="text-base font-bold text-gray-900 mt-2 tracking-tight">
              Loading Account Statement...
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              Retrieving transaction history, passbook entries, and running float balances.
            </p>
          </div>
        </div>
      ) : !activeAccount ? (
        /* Center Card when no account is selected - Finacle 3-Tier Enterprise Card */
        <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar bg-slate-50/60">
          <div className="min-h-full flex flex-col items-center justify-center pt-4 pb-28 md:pb-36">
            <div className="w-full max-w-2xl mx-auto -translate-y-4 md:-translate-y-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (selectedAccountNo) {
                    handleSelectAccount(selectedAccountNo);
                  }
                }}
                className="bg-white border border-gray-200 rounded-lg shadow-xs"
              >
              {/* Card Header (Canara Bank Royal Navy Bar) */}
              <div className="bg-[#0E498C] text-white px-5 py-3.5 flex items-center justify-between rounded-t-lg shadow-xs">
                <div className="flex items-center gap-2.5">
                  <Landmark className="w-4 h-4 text-[#00B5E2] shrink-0" />
                  <span className="font-bold text-sm text-white uppercase tracking-wide">
                    Account Statement &amp; Value Date
                  </span>
                </div>
                <span className="text-[11px] bg-[#FFB800] text-black border border-[#e5a600] font-bold px-2 py-0.5 rounded font-mono shadow-2xs">
                  ACLI
                </span>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* 1. Account Opening / Value Date */}
                  <div>
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                      <span>Statement Value Date:</span>
                      <span className="text-[11px] font-normal text-gray-500">Value Date</span>
                    </label>
                    <FinacleDatePicker
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-semibold text-gray-900 shadow-2xs hover:border-gray-400 focus-within:border-[#104080] focus-within:ring-1 focus-within:ring-[#104080] flex items-center justify-between min-h-[38px]"
                    />
                  </div>

                  {/* 2. Select Target Account Scheme / Account */}
                  <div>
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                      <span>Select Target Account: *</span>
                      <span className="text-[11px] font-normal text-gray-500">Active Accounts</span>
                    </label>
                    <FinacleSelect
                      value={selectedAccountNo}
                      onChange={(e) => setSelectedAccountNo(e.target.value)}
                      options={[
                        { value: "", label: "— Choose an Account —" },
                        ...accounts.map((a) => {
                          const scheme = resolveAccountScheme(a.account_type, a.account_no);
                          return {
                            value: a.account_no,
                            label: `${a.account_no} — ${a.name}`,
                            badge: `${a.branch === "UAE" ? "AED" : "INR"} • ${scheme}`
                          };
                        })
                      ]}
                      searchable={true}
                      searchPlaceholder="Type Account No, CIF, or Name..."
                      placeholder={loadingAccounts ? "Loading accounts..." : "— Choose an Account —"}
                      triggerClassName="!h-[38px] bg-white hover:bg-slate-50 border border-gray-300 rounded-md text-xs font-mono font-bold text-[#104080] shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer Ribbon */}
              <div className="bg-slate-50 border-t border-gray-200 px-6 py-3.5 flex items-center justify-between rounded-b-lg">
                <div className="flex items-center gap-2">
                  {onNavigateToAccounts && (
                    <button
                      type="button"
                      onClick={onNavigateToAccounts}
                      className="px-4 py-2 border border-gray-300 hover:bg-[#EBF6FC] hover:text-[#0E498C] text-gray-700 rounded-md text-xs font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Browse in Enquiry (ACIQ)</span>
                    </button>
                  )}
                  {(selectedAccountNo || fromDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAccountNo("");
                        setFromDate("");
                      }}
                      className="px-3 py-2 border border-gray-300 hover:bg-gray-100 text-gray-600 rounded-md text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                    >
                      Clear Form
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!selectedAccountNo || loadingAccounts}
                  className={`flex items-center gap-2 px-5 py-2 rounded-md text-xs font-bold shadow-md transition-all ${
                    selectedAccountNo && !loadingAccounts
                      ? "bg-[#0E498C] hover:bg-[#00A2E8] border border-[#00B5E2] text-white cursor-pointer"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                  }`}
                >
                  <span>Fetch Statement</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      ) : (
        <>
          {/* 2. Dedicated Filter & Criteria Toolbar */}
          <div className="bg-[#f8fafc] px-4 md:px-6 py-2 border-b border-[#c4d4ec] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-3">
              {/* Account Selector Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-gray-700 shrink-0">Account:</span>
                <div className="w-[280px] sm:w-[340px]">
                  <FinacleSelect
                    value={selectedAccountNo}
                    onChange={(e) => handleSelectAccount(e.target.value)}
                    options={[
                      { value: "", label: "— Choose an Account —" },
                      ...accounts.map((a) => {
                        const scheme = resolveAccountScheme(a.account_type, a.account_no);
                        return {
                          value: a.account_no,
                          label: `${a.account_no} — ${a.name}`,
                          badge: `${a.branch === "UAE" ? "AED" : "INR"} • ${scheme}`
                        };
                      })
                    ]}
                    searchable={true}
                    searchPlaceholder="Type Account No, CIF, or Name..."
                    placeholder={loadingAccounts ? "Loading accounts..." : "Select account..."}
                    triggerClassName="!h-[32px] bg-white hover:bg-slate-50 border border-[#c4d4ec] rounded text-xs font-mono font-bold text-[#104080]"
                  />
                </div>
              </div>

              {/* Date Pickers */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-gray-700">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-[32px] bg-white border border-[#c4d4ec] rounded px-2 text-xs focus:outline-none focus:border-[#104080]"
                />
                <span className="text-[11px] font-bold text-gray-700">To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-[32px] bg-white border border-[#c4d4ec] rounded px-2 text-xs focus:outline-none focus:border-[#104080]"
                />
              </div>

              {/* Quick Date Presets */}
              <div className="hidden lg:flex items-center border border-[#c4d4ec] rounded overflow-hidden text-[11px] bg-white h-[32px]">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10);
                    setFromDate(today);
                    setToDate(today);
                    if (activeAccount) loadAccountTransactions(activeAccount, today, today);
                  }}
                  className="px-2.5 py-1 text-gray-700 hover:bg-gray-100 font-medium cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10);
                    const d = new Date();
                    d.setDate(d.getDate() - 7);
                    const from = d.toISOString().slice(0, 10);
                    setFromDate(from);
                    setToDate(today);
                    if (activeAccount) loadAccountTransactions(activeAccount, from, today);
                  }}
                  className="px-2.5 py-1 text-gray-700 hover:bg-gray-100 font-medium cursor-pointer border-l border-[#c4d4ec]"
                >
                  7D
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10);
                    const d = new Date();
                    d.setDate(d.getDate() - 30);
                    const from = d.toISOString().slice(0, 10);
                    setFromDate(from);
                    setToDate(today);
                    if (activeAccount) loadAccountTransactions(activeAccount, from, today);
                  }}
                  className="px-2.5 py-1 text-gray-700 hover:bg-gray-100 font-medium cursor-pointer border-l border-[#c4d4ec]"
                >
                  30D
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                    if (activeAccount) loadAccountTransactions(activeAccount, "", "");
                  }}
                  className="px-2.5 py-1 text-gray-700 hover:bg-gray-100 font-medium cursor-pointer border-l border-[#c4d4ec]"
                >
                  All
                </button>
              </div>

              {/* Fetch Button */}
              <button
                type="button"
                onClick={handleFetchTransactions}
                disabled={loadingLedger || !activeAccount}
                className="h-[32px] bg-[#0E498C] hover:bg-[#00A2E8] border border-[#00B5E2] disabled:opacity-50 text-white font-bold px-3.5 rounded flex items-center gap-1.5 text-xs transition-colors cursor-pointer shadow-2xs"
                title="Apply Date Filters & Fetch Statement"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLedger ? "animate-spin" : ""}`} />
                <span>Fetch</span>
              </button>
            </div>

            {/* Right: Actions (Back to ACIQ, Excel, PDF) */}
            <div className="flex items-center gap-2">
              {onNavigateToAccounts && (
                <button
                  type="button"
                  onClick={onNavigateToAccounts}
                  className="h-[32px] flex items-center gap-1.5 bg-white hover:bg-[#EBF6FC] text-[#0E498C] font-bold px-3 rounded border border-[#c4d4ec] transition-colors cursor-pointer text-xs shadow-2xs"
                  title="Return to Account Enquiry (ACIQ)"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Enquiry (ACIQ)</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExportExcel}
                disabled={filteredLedger.length === 0 || !activeAccount}
                className="h-[32px] flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white px-3 rounded text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                title="Export Ledger to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={filteredLedger.length === 0 || !activeAccount}
                className="h-[32px] flex items-center gap-1.5 bg-[#0E498C] hover:bg-[#00A2E8] border border-[#00B5E2] disabled:opacity-40 text-white px-3 rounded text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                title="Print Account Statement PDF"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF Statement</span>
              </button>
            </div>
          </div>

          {/* 2. Account Master Dossier Ribbon */}
          <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-2.5 shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {/* Account Profile Info */}
              <div className="col-span-2 bg-[#f0f4f8] border border-[#c4d4ec] rounded p-2.5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase">Account Holder Title</div>
                  <div className="font-bold text-gray-900 text-sm truncate max-w-[220px] uppercase tracking-wide">
                    {activeAccount.name ? activeAccount.name.toUpperCase() : ""}
                  </div>
                  <div className="text-[11px] font-mono text-[#104080] font-bold flex items-center gap-1 mt-0.5">
                    <span>{activeAccount.account_no}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyAcc(activeAccount.account_no)}
                      className="text-gray-400 hover:text-[#104080] p-0.5 rounded cursor-pointer"
                      title="Copy Account Number"
                    >
                      {copiedAccNo === activeAccount.account_no ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${schemeInfo.badgeClass}`}>
                    [{schemeInfo.code}] {schemeKey}
                  </span>
                  <div className="text-[10px] text-gray-500 font-mono mt-1">
                    CIF: {activeAccount.cif_no || "N/A"}
                  </div>
                </div>
              </div>

              {/* Metric 1: Opening / Initial Balance */}
              <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                <div className="text-[10px] font-bold text-gray-500 uppercase">Opening Balance</div>
                <div className="text-base font-extrabold text-gray-800 font-mono mt-0.5">
                  {currencySym} {Number(activeAccount.initial_deposit || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-400 font-mono">
                  Date: {activeAccount.opening_date || "Genesis"}
                </div>
              </div>

              {/* Metric 2: Total Credits (+) */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded p-2.5">
                <div className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                  <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                  <span>Total Credits</span>
                </div>
                <div className="text-base font-extrabold text-emerald-700 font-mono mt-0.5">
                  {currencySym} {ledgerMetrics.totalCredits.toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold">
                  Total Deposits
                </div>
              </div>

              {/* Metric 3: Total Debits (-) */}
              <div className="bg-rose-50/60 border border-rose-200 rounded p-2.5">
                <div className="text-[10px] font-bold text-rose-800 uppercase flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-rose-600" />
                  <span>Total Debits</span>
                </div>
                <div className="text-base font-extrabold text-rose-700 font-mono mt-0.5">
                  {currencySym} {ledgerMetrics.totalDebits.toLocaleString()}
                </div>
                <div className="text-[10px] text-rose-600 font-semibold">
                  Total Disbursements
                </div>
              </div>

              {/* Metric 4: Net Current Ledger Balance - Canara Bank Ice Blue Highlight */}
              <div className="bg-[#EBF6FC] border border-[#bce2f8] rounded p-2.5">
                <div className="text-[10px] font-bold text-[#0E498C] uppercase">Current Balance</div>
                <div className="text-base font-extrabold text-[#0E498C] font-mono mt-0.5">
                  {currencySym} {ledgerMetrics.finalBalance.toLocaleString()}
                </div>
                <div className="text-[10px] text-[#00A2E8] font-bold">
                  Available Float
                </div>
              </div>
            </div>
          </div>

          {/* 3. In-Ledger Search & Filter Command Bar */}
          <div className="p-2.5 md:px-6 border-b border-gray-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Quick Search */}
              <div className="relative min-w-[240px] max-w-sm flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2" />
                <input
                  type="text"
                  value={ledgerSearchQuery}
                  onChange={(e) => setLedgerSearchQuery(e.target.value)}
                  placeholder="Search UTR, Ref No, Narration, Beneficiary..."
                  className="w-full bg-slate-50 border border-gray-300 rounded pl-9 pr-3 py-1 text-xs focus:bg-white focus:outline-none focus:border-[#104080] font-semibold h-[28px]"
                />
                {ledgerSearchQuery && (
                  <button
                    onClick={() => setLedgerSearchQuery("")}
                    className="absolute right-2.5 top-1.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Direction Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-gray-600 shrink-0">Movement:</span>
                <div className="w-[150px]">
                  <FinacleSelect
                    value={ledgerDirectionFilter}
                    onChange={(e) => setLedgerDirectionFilter(e.target.value as any)}
                    options={[
                      { value: "all", label: "All Movements" },
                      { value: "credit", label: "Credits Only (+)" },
                      { value: "debit", label: "Debits Only (-)" },
                    ]}
                    searchable={false}
                    triggerClassName="!h-[28px] bg-slate-50 border border-gray-300 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Total Results Summary */}
            <div className="text-[11px] text-gray-500 font-medium">
              Showing <span className="font-bold text-[#104080]">{startRecord}</span> - <span className="font-bold text-[#104080]">{endRecord}</span> of <span className="font-bold text-[#104080]">{filteredLedger.length}</span> transactions
            </div>
          </div>

          {/* 4. Transaction Ledger Table */}
          <div className="flex-1 overflow-y-auto p-4 md:px-6 custom-scrollbar bg-slate-50">
            {loadingLedger ? (
              <div className="border border-[#c4d4ec] rounded bg-white shadow-2xs flex flex-col items-center justify-center p-12 text-gray-500">
                <RefreshCw className="w-7 h-7 animate-spin text-[#104080] mb-2" />
                <span className="text-xs font-bold text-[#104080]">Loading ledger passbook statement...</span>
              </div>
            ) : filteredLedger.length === 0 ? (
              <div className="border border-[#c4d4ec] rounded bg-white shadow-2xs flex flex-col items-center justify-center p-12 text-gray-400">
                <div className="text-sm font-semibold">No transactions matched your criteria.</div>
                <div className="text-[11px] mt-1 text-gray-400">Try adjusting the date range or search query.</div>
              </div>
            ) : (
              <div className="border border-[#c4d4ec] rounded bg-white shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="sticky top-0 bg-[#0E498C] text-white z-10 shadow-xs">
                      <tr>
                        <th className="py-2.5 px-3.5 font-bold border-r border-[#195ca5] w-12 text-center">#</th>
                        <th className="py-2.5 px-3.5 font-bold border-r border-[#195ca5] w-24">Date</th>
                        <th className="py-2.5 px-3.5 font-bold border-r border-[#195ca5] w-28">Txn Ref</th>
                        <th className="py-2.5 px-3.5 font-bold border-r border-[#195ca5] w-36">UTR / Order</th>
                        <th className="py-2.5 px-3.5 font-bold border-r border-[#195ca5]">Particulars &amp; Narration</th>
                        <th className="py-2.5 px-3.5 font-bold border-r border-[#195ca5] w-28">Mode / Channel</th>
                        <th className="py-2.5 px-3.5 font-bold border-r border-[#195ca5] text-right w-32 bg-[#093566]">Debit (-)</th>
                        <th className="py-2.5 px-3.5 font-bold border-r border-[#195ca5] text-right w-32 bg-[#093566]">Credit (+)</th>
                        <th className="py-2.5 px-3.5 font-bold border-r border-[#195ca5] text-right w-36 bg-[#002D62]">Running Balance</th>
                        <th className="py-2.5 px-3.5 font-bold text-center w-20">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEntries.map((e, idx) => {
                        const rowNum = startRecord + idx;
                        const isCredit = e.credit > 0;
                        const isDebit = e.debit > 0;
                        return (
                          <tr
                            key={e.id}
                            className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors"
                          >
                            <td className="py-2.5 px-3.5 text-center text-gray-500 font-mono text-[10px]">{rowNum}</td>
                            <td className="py-2.5 px-3.5 font-mono font-semibold text-gray-700 whitespace-nowrap">
                              {e.entry_date}
                            </td>
                            <td className="py-2.5 px-3.5 font-mono font-bold text-[#104080] whitespace-nowrap">
                              {e.txn_no}
                            </td>
                            <td className="py-2.5 px-3.5 font-mono text-gray-600 truncate max-w-[140px]" title={e.utr_number}>
                              {e.utr_number || e.ref_no || "-"}
                            </td>
                            <td className="py-2.5 px-3.5 font-medium text-gray-800">
                              <div>{e.narration}</div>
                              {e.beneficiary_name && (
                                <div className="text-[10px] text-gray-500 font-normal">
                                  Beneficiary: <span className="font-semibold text-gray-700">{e.beneficiary_name}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5 text-gray-600 uppercase font-semibold">
                              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] border border-slate-200">
                                {e.payment_mode || "TRANSFER"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                              {isDebit ? (
                                <span className="inline-flex items-center gap-0.5">
                                  <span>- {currencySym}</span> {Number(e.debit).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                              {isCredit ? (
                                <span className="inline-flex items-center gap-0.5">
                                  <span>+ {currencySym}</span> {Number(e.credit).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-extrabold text-[#104080] whitespace-nowrap bg-blue-50/30">
                              {currencySym} {Number(e.running_balance).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3.5 text-center">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  e.status === "BOUNCED"
                                    ? "bg-rose-100 text-rose-800 border border-rose-300"
                                    : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                }`}
                              >
                                {e.status || "POSTED"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 5. Pagination Footer Bar */}
          {filteredLedger.length > 0 && (
            <div className="bg-slate-100 border-t border-gray-200 px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-[#c4d4ec] rounded px-2 py-0.5 text-[11px] font-semibold text-gray-700"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="px-2 py-0.5 border border-[#c4d4ec] bg-white text-[#104080] font-bold rounded hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[11px] cursor-pointer shadow-2xs"
                  title="First Page"
                >
                  &laquo; First
                </button>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-0.5 border border-[#c4d4ec] bg-white text-[#104080] font-bold rounded hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[11px] cursor-pointer shadow-2xs"
                  title="Previous Page"
                >
                  &lsaquo; Prev
                </button>

                <span className="px-3 py-0.5 font-bold text-[#104080] bg-white border border-[#c4d4ec] rounded text-[11px] shadow-2xs">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-0.5 border border-[#c4d4ec] bg-white text-[#104080] font-bold rounded hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[11px] cursor-pointer shadow-2xs"
                  title="Next Page"
                >
                  Next &rsaquo;
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-2 py-0.5 border border-[#c4d4ec] bg-white text-[#104080] font-bold rounded hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[11px] cursor-pointer shadow-2xs"
                  title="Last Page"
                >
                  Last &raquo;
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
