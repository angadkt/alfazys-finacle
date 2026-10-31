import React, { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import { resolveAccountScheme } from "../utils/schemeUtils";
import {
  Search,
  RefreshCw,
  Landmark,
  FileSpreadsheet,
  FileText,
  Filter,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  ShieldCheck,
  Building2,
  CreditCard,
  PiggyBank,
  Briefcase,
  Scale,
  Users,
  Wallet,
  TrendingUp,
  Receipt,
  X,
  Calendar
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import FinacleSelect from "./FinacleSelect";

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
  bank_accounts?: any[];
}

const SCHEME_CONFIG: Record<
  string,
  { code: string; label: string; badgeClass: string; icon: React.ReactNode }
> = {
  SAVINGS: {
    code: "1020",
    label: "Savings Bank Account (SBA)",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <PiggyBank className="w-3.5 h-3.5 text-emerald-600" />
  },
  SALARY: {
    code: "1050",
    label: "Salary Account (SAL)",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
    icon: <Briefcase className="w-3.5 h-3.5 text-teal-600" />
  },
  CURRENT: {
    code: "1030",
    label: "Current Account (CAA)",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <Building2 className="w-3.5 h-3.5 text-blue-600" />
  },
  CORPORATE_SINGLE: {
    code: "1060",
    label: "Corporate Single (CAP-S)",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: <Building2 className="w-3.5 h-3.5 text-indigo-600" />
  },
  CORPORATE_JOINT: {
    code: "1070",
    label: "Corporate Joint (CAP-J)",
    badgeClass: "bg-violet-50 text-violet-700 border-violet-200",
    icon: <Users className="w-3.5 h-3.5 text-violet-600" />
  },
  BORROWED: {
    code: "1040",
    label: "Overdraft / Loan (ODA)",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Scale className="w-3.5 h-3.5 text-amber-600" />
  },
  PROFIT: {
    code: "2010",
    label: "Profit Account (PFT)",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
    icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
  },
  EXPENSE: {
    code: "2020",
    label: "Expense Account (EXP)",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    icon: <Receipt className="w-3.5 h-3.5 text-rose-600" />
  },
  SERVICER: {
    code: "1010",
    label: "Servicer Float (SRV)",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    icon: <Wallet className="w-3.5 h-3.5 text-sky-600" />
  }
};

interface AccountInquiryScreenProps {
  onNavigateToLedger?: (accountNo: string) => void;
}

export default function AccountInquiryScreen({ onNavigateToLedger }: AccountInquiryScreenProps = {}) {
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchemeFilter, setSelectedSchemeFilter] = useState("ALL");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeAccountDossier, setActiveAccountDossier] = useState<AccountRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const schemeOptions = useMemo(() => [
    { value: "ALL", label: `All Account Schemes (${accounts.length})` },
    { value: "SAVINGS", label: "Savings Account (1020 - SBA)" },
    { value: "SALARY", label: "Salary Account (1050 - SAL)" },
    { value: "CURRENT", label: "Current Account (1030 - CAA)" },
    { value: "CORPORATE_SINGLE", label: "Corporate Single (1060 - CAP-S)" },
    { value: "CORPORATE_JOINT", label: "Corporate Joint (1070 - CAP-J)" },
    { value: "BORROWED", label: "Overdraft / Loan (1040 - ODA)" },
    { value: "PROFIT", label: "Profit Account (2010 - PFT)" },
    { value: "EXPENSE", label: "Expense Account (2020 - EXP)" },
    { value: "SERVICER", label: "Servicer Float (1010 - SRV)" },
  ], [accounts.length]);

  const branchOptions = useMemo(() => [
    { value: "ALL", label: "All Branches" },
    { value: "INDIA", label: "India (INR - ₹)" },
    { value: "UAE", label: "Dubai (AED - د.إ)" },
  ], []);

  const pageSizeOptions = useMemo(() => [
    { value: "10", label: "10" },
    { value: "20", label: "20" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ], []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/payouts/servicers");
      const list: AccountRecord[] = res.data?.servicers || [];
      setAccounts(list);
    } catch (err) {
      console.error("Failed to load accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCopyAccountNo = (accNo: string) => {
    navigator.clipboard.writeText(accNo);
    setCopiedId(accNo);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // Scheme Filter
      if (selectedSchemeFilter !== "ALL") {
        const accScheme = resolveAccountScheme(acc.account_type, acc.account_no);
        if (accScheme !== selectedSchemeFilter) return false;
      }

      // Branch Filter
      if (selectedBranchFilter !== "ALL") {
        const b = (acc.branch || "INDIA").toUpperCase();
        if (b !== selectedBranchFilter) return false;
      }

      // Date Range Filter (Opening Date / Value Date)
      if (fromDate || toDate) {
        const rawDate = acc.opening_date || (acc.created_at ? acc.created_at.slice(0, 10) : "");
        if (rawDate) {
          if (fromDate && rawDate < fromDate) return false;
          if (toDate && rawDate > toDate) return false;
        } else {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const accNo = (acc.account_no || "").toLowerCase();
        const name = (acc.name || "").toLowerCase();
        const cif = (acc.cif_no || "").toLowerCase();
        const phone = (acc.phone || "").toLowerCase();
        const city = (acc.city || "").toLowerCase();
        const ifsc = (acc.ifsc_code || "").toLowerCase();
        const scheme = resolveAccountScheme(acc.account_type, acc.account_no).toLowerCase();

        return (
          accNo.includes(q) ||
          name.includes(q) ||
          cif.includes(q) ||
          phone.includes(q) ||
          city.includes(q) ||
          ifsc.includes(q) ||
          scheme.includes(q)
        );
      }

      return true;
    });
  }, [accounts, selectedSchemeFilter, selectedBranchFilter, searchQuery, fromDate, toDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSchemeFilter, selectedBranchFilter, pageSize, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / pageSize));

  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAccounts.slice(start, start + pageSize);
  }, [filteredAccounts, currentPage, pageSize]);

  const startRecord = filteredAccounts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, filteredAccounts.length);

  // Statistics
  const stats = useMemo(() => {
    const total = accounts.length;
    const savings = accounts.filter((a) => resolveAccountScheme(a.account_type, a.account_no) === "SAVINGS").length;
    const current = accounts.filter((a) => resolveAccountScheme(a.account_type, a.account_no) === "CURRENT").length;
    const corporate = accounts.filter((a) =>
      resolveAccountScheme(a.account_type, a.account_no).includes("CORPORATE")
    ).length;
    const overdraft = accounts.filter((a) => resolveAccountScheme(a.account_type, a.account_no) === "BORROWED").length;
    const servicer = accounts.filter((a) => resolveAccountScheme(a.account_type, a.account_no) === "SERVICER").length;

    return { total, savings, current, corporate, overdraft, servicer };
  }, [accounts]);

  // Export to Excel
  const handleExportExcel = () => {
    const rows = filteredAccounts.map((a, idx) => {
      const schemeType = resolveAccountScheme(a.account_type, a.account_no);
      const scheme = SCHEME_CONFIG[schemeType] || {
        code: "1000",
        label: schemeType || "General Ledger"
      };
      return {
        "Sl. No": idx + 1,
        "Legal Account Holder": a.name || "N/A",
        "Account Number": a.account_no || "N/A",
        "Scheme Code": scheme.code,
        "Scheme Type": scheme.label,
        "Master CIF #": a.cif_no || "N/A",
        "Operating Branch": a.branch === "UAE" ? "Dubai (AED)" : "India (INR)",
        "Clearing IFSC": a.ifsc_code || "N/A",
        "Registered Phone": a.phone || "N/A",
        "Opening Date": a.opening_date || (a.created_at ? a.created_at.slice(0, 10) : "N/A"),
        "Sanctioned Limit": a.sanctioned_limit || "0.00",
        "Initial Deposit": a.initial_deposit || "0.00",
        "Status": a.status || "ACTIVE"
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Finacle_Accounts");
    XLSX.writeFile(
      workbook,
      `Finacle_Accounts_Inquiry_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // Export to PDF
  const handleExportPdf = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(14);
    doc.setTextColor(16, 64, 128); // Finacle Blue
    doc.text("FINACLE CORE BANKING — GENERAL LEDGER & ACCOUNTS INQUIRY", 14, 15);

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(
      `Generated on: ${new Date().toLocaleString()} | Filter: ${selectedSchemeFilter} | Total Accounts: ${filteredAccounts.length}`,
      14,
      22
    );

    const tableRows = filteredAccounts.map((a, idx) => {
      const schemeType = resolveAccountScheme(a.account_type, a.account_no);
      const scheme = SCHEME_CONFIG[schemeType] || {
        code: "1000",
        label: schemeType || "GL"
      };
      return [
        idx + 1,
        a.name || "N/A",
        a.account_no || "N/A",
        `${scheme.code} - ${schemeType}`,
        a.cif_no || "N/A",
        a.branch === "UAE" ? "Dubai (AED)" : "India (INR)",
        a.ifsc_code || "N/A",
        a.opening_date || (a.created_at ? a.created_at.slice(0, 10) : "-"),
        a.sanctioned_limit ? `Limit: ${a.sanctioned_limit}` : (a.initial_deposit ? `Dep: ${a.initial_deposit}` : "-"),
        a.status || "ACTIVE"
      ];
    });

    autoTable(doc, {
      startY: 26,
      head: [
        [
          "#",
          "Account Holder Title",
          "Account Number",
          "Scheme",
          "CIF No.",
          "Branch",
          "IFSC",
          "Value Date",
          "Deposit/Limit",
          "Status"
        ]
      ],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [16, 64, 128], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(`Finacle_Accounts_Inquiry_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden text-xs select-none">
      {/* 1. Header Bar */}
      <div className="bg-white px-5 md:px-8 py-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Landmark className="w-5 h-5 text-[#0E498C]" />
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
              General Ledger Account Inquiry (ACIQ)
            </h1>
            <p className="text-[11px] text-gray-500">
              Core Banking Universal Account Master Registry &amp; Ledger Directory
            </p>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Summary Ribbon */}
      <div className="bg-white border-b border-gray-200 px-5 md:px-8 py-3.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 shrink-0">
        <div className="bg-[#EBF6FC] border border-[#bce2f8] rounded-md p-3.5 min-h-[74px] flex flex-col justify-between shadow-2xs">
          <div className="text-[10.5px] font-bold text-[#0E498C] uppercase tracking-wide">Total Accounts</div>
          <div className="text-xl md:text-2xl font-black text-[#0E498C] font-mono leading-none mt-1">{stats.total}</div>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-md p-3.5 min-h-[74px] flex flex-col justify-between shadow-2xs">
          <div className="text-[10.5px] font-bold text-emerald-800 uppercase tracking-wide">Savings (SBA)</div>
          <div className="text-xl md:text-2xl font-black text-emerald-700 font-mono leading-none mt-1">{stats.savings}</div>
        </div>
        <div className="bg-blue-50/70 border border-blue-200 rounded-md p-3.5 min-h-[74px] flex flex-col justify-between shadow-2xs">
          <div className="text-[10.5px] font-bold text-blue-800 uppercase tracking-wide">Current (CAA)</div>
          <div className="text-xl md:text-2xl font-black text-blue-700 font-mono leading-none mt-1">{stats.current}</div>
        </div>
        <div className="bg-violet-50/70 border border-violet-200 rounded-md p-3.5 min-h-[74px] flex flex-col justify-between shadow-2xs">
          <div className="text-[10.5px] font-bold text-violet-800 uppercase tracking-wide">Corporate (CAP)</div>
          <div className="text-xl md:text-2xl font-black text-violet-700 font-mono leading-none mt-1">{stats.corporate}</div>
        </div>
        <div className="bg-amber-50/70 border border-amber-200 rounded-md p-3.5 min-h-[74px] flex flex-col justify-between shadow-2xs">
          <div className="text-[10.5px] font-bold text-amber-800 uppercase tracking-wide">Overdraft (ODA)</div>
          <div className="text-xl md:text-2xl font-black text-amber-700 font-mono leading-none mt-1">{stats.overdraft}</div>
        </div>
        <div className="bg-sky-50/70 border border-sky-200 rounded-md p-3.5 min-h-[74px] flex flex-col justify-between shadow-2xs">
          <div className="text-[10.5px] font-bold text-sky-800 uppercase tracking-wide">Servicer (SRV)</div>
          <div className="text-xl md:text-2xl font-black text-sky-700 font-mono leading-none mt-1">{stats.servicer}</div>
        </div>
      </div>

      {/* 3. Search and Filter Command Bar with Action Buttons */}
      <div className="p-4 md:px-8 border-b border-gray-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0 relative z-30">
        {/* Left: Search Input & Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative min-w-[240px] max-w-sm flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Account No, CIF #, Name, Phone, or IFSC..."
              className="w-full bg-slate-50 border border-gray-300 rounded-md pl-9 pr-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-[#104080] focus:ring-1 focus:ring-[#104080] transition-all h-[32px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Scheme Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <span className="text-[11px] font-bold text-gray-600 shrink-0">Scheme:</span>
            <div className="min-w-[230px]">
              <FinacleSelect
                value={selectedSchemeFilter}
                onChange={(e) => setSelectedSchemeFilter(e.target.value)}
                options={schemeOptions}
                searchable={true}
                searchPlaceholder="Search scheme..."
                triggerClassName="!h-[32px] !py-1 text-xs font-semibold bg-white border border-[#c4d4ec] rounded px-2.5 shadow-2xs"
              />
            </div>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-600 shrink-0">Branch:</span>
            <div className="min-w-[150px]">
              <FinacleSelect
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                options={branchOptions}
                searchable={false}
                triggerClassName="!h-[32px] !py-1 text-xs font-semibold bg-white border border-[#c4d4ec] rounded px-2.5 shadow-2xs"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-[#f8fafc] border border-[#c4d4ec] rounded px-2 h-[32px] shadow-2xs">
            <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-[#104080]" />
              <span>From:</span>
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-white border border-[#c4d4ec] rounded px-1.5 py-0.5 text-xs text-gray-800 focus:outline-none focus:border-[#104080] h-[24px]"
            />
            <span className="text-[11px] font-bold text-gray-700 shrink-0 ml-0.5">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-white border border-[#c4d4ec] rounded px-1.5 py-0.5 text-xs text-gray-800 focus:outline-none focus:border-[#104080] h-[24px]"
            />
            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={() => { setFromDate(""); setToDate(""); }}
                className="text-gray-400 hover:text-red-600 font-bold text-xs px-1 cursor-pointer"
                title="Clear Date Filter"
              >
                &times;
              </button>
            )}
          </div>

          {/* Quick Date Shortcuts */}
          <div className="hidden xl:flex items-center border border-[#c4d4ec] rounded overflow-hidden text-[11px] bg-white h-[32px] shadow-2xs">
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                setFromDate(today);
                setToDate(today);
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
                setFromDate(d.toISOString().slice(0, 10));
                setToDate(today);
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
                setFromDate(d.toISOString().slice(0, 10));
                setToDate(today);
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
              }}
              className="px-2.5 py-1 text-gray-700 hover:bg-gray-100 font-medium cursor-pointer border-l border-[#c4d4ec]"
            >
              All
            </button>
          </div>
        </div>

        {/* Right: Actions (Refresh, Excel, PDF) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAccounts}
            disabled={loading}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors border border-gray-300 shadow-2xs"
            title="Refresh Account Registry"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-600 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={filteredAccounts.length === 0}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
            title="Export to Excel Spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={filteredAccounts.length === 0}
            className="flex items-center gap-1.5 bg-[#0E498C] hover:bg-[#00A2E8] text-white px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors shadow-2xs disabled:opacity-50 border border-[#00B5E2]/40"
            title="Export to PDF Report"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* 4. Accounts Table (Styled identical to Order Entry) */}
      <div className="flex-1 overflow-y-auto p-4 md:px-8 custom-scrollbar">
        <div className="overflow-x-auto border border-[#c4d4ec] bg-white shadow-2xs">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="bg-[#0E498C] text-white">
                <th className="p-2 border border-[#a0a0a0] w-10 text-center font-bold">#</th>
                <th className="p-2 border border-[#a0a0a0] font-bold">Account Holder Legal Title</th>
                <th className="p-2 border border-[#a0a0a0] font-bold">Account Number</th>
                <th className="p-2 border border-[#a0a0a0] font-bold">Scheme &amp; Code</th>
                <th className="p-2 border border-[#a0a0a0] font-bold">Master CIF</th>
                <th className="p-2 border border-[#a0a0a0] font-bold">Operating Branch / IFSC</th>
                <th className="p-2 border border-[#a0a0a0] font-bold">Opening Date</th>
                <th className="p-2 border border-[#a0a0a0] font-bold text-right">Initial Dep. / Limit</th>
                <th className="p-2 border border-[#a0a0a0] font-bold text-center">Status</th>
                <th className="p-2 border border-[#a0a0a0] font-bold text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500 border border-[#c4d4ec]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#104080] mb-2" />
                    <span className="font-bold">Loading General Ledger Accounts...</span>
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500 border border-[#c4d4ec]">
                    <Landmark className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-bold text-gray-700 text-sm">No Accounts Found</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {searchQuery
                        ? "No bank account records match your search query."
                        : "No accounts have been created yet under this scheme filter."}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedAccounts.map((acc, index) => {
                  const schemeType = resolveAccountScheme(acc.account_type, acc.account_no);
                  const scheme = SCHEME_CONFIG[schemeType] || {
                    code: "1000",
                    label: schemeType || "General Ledger",
                    badgeClass: "bg-gray-100 text-gray-700 border-gray-300",
                    icon: <Landmark className="w-3.5 h-3.5" />
                  };

                  const isUae = (acc.branch || "").toUpperCase() === "UAE";
                  const currencySym = isUae ? "AED" : "₹";
                  const isJoint = schemeType === "CORPORATE_JOINT";
                  const isBorrowed = schemeType === "BORROWED";

                  return (
                    <tr
                      key={acc.id || index}
                      className="hover:bg-[#EBF6FC] cursor-pointer transition-colors"
                      onClick={() => setActiveAccountDossier(acc)}
                    >
                      {/* Index */}
                      <td className="p-2 border border-[#c4d4ec] text-center font-bold text-gray-700 select-none">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      {/* Legal Account Holder Title */}
                      <td className="p-2 border border-[#c4d4ec] font-bold text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[200px] uppercase tracking-wide" title={acc.name}>
                            {acc.name ? acc.name.toUpperCase() : "UNNAMED ACCOUNT"}
                          </span>
                          {isJoint && (
                            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">
                              JOINT
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Account Number */}
                      <td className="p-2 border border-[#c4d4ec] font-bold text-blue-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="select-all">
                            {acc.account_no || "N/A"}
                          </span>
                          {acc.account_no && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyAccountNo(acc.account_no);
                              }}
                              className="text-gray-400 hover:text-[#104080] p-0.5 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                              title="Copy Account Number"
                            >
                              {copiedId === acc.account_no ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Scheme Code & Badge */}
                      <td className="p-2 border border-[#c4d4ec]">
                        <span className="bg-[#e8eef8] text-[#104080] border border-[#c4d4ec] text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <span>[{scheme.code}]</span>
                          <span>
                            {schemeType === "CORPORATE_JOINT"
                              ? "CAP-J"
                              : schemeType === "CORPORATE_SINGLE"
                              ? "CAP-S"
                              : schemeType}
                          </span>
                        </span>
                      </td>

                      {/* Master CIF */}
                      <td className="p-2 border border-[#c4d4ec] font-bold text-blue-800 font-mono whitespace-nowrap">
                        {acc.cif_no ? (
                          <span className="inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>{acc.cif_no}</span>
                          </span>
                        ) : acc.party_id ? (
                          <span>CIF #{acc.party_id}</span>
                        ) : (
                          <span className="text-gray-400 italic font-normal">Unlinked</span>
                        )}
                      </td>

                      {/* Branch & IFSC */}
                      <td className="p-2 border border-[#c4d4ec] text-gray-800">
                        <div className="font-bold">
                          {isUae ? "Dubai Regional" : "India Clearing"}
                        </div>
                        <div className="text-[10px] font-mono text-gray-500 font-bold">
                          {acc.ifsc_code || (isUae ? "FNCL0000971" : "CNRB0001020")}
                        </div>
                      </td>

                      {/* Opening Date */}
                      <td className="p-2 border border-[#c4d4ec] font-bold whitespace-nowrap text-gray-800">
                        {acc.opening_date || (acc.created_at ? acc.created_at.slice(0, 10) : "—")}
                      </td>

                      {/* Financial Value (Initial Deposit / Sanctioned Limit) */}
                      <td className="p-2 border border-[#c4d4ec] font-bold text-right whitespace-nowrap">
                        {isBorrowed ? (
                          <span className="text-amber-800 font-mono">
                            {currencySym} {Number(acc.sanctioned_limit || 0).toLocaleString()}
                          </span>
                        ) : Number(acc.initial_deposit || 0) > 0 ? (
                          <span className="text-emerald-700 font-mono">
                            {currencySym} {Number(acc.initial_deposit).toLocaleString()}
                          </span>
                        ) : acc.wallet?.bank_balance !== undefined ? (
                          <span className="text-black font-mono">
                            {currencySym} {Number(acc.wallet.bank_balance).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-mono">0.00</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-2 border border-[#c4d4ec] text-center" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[11px] font-bold rounded px-2 py-0.5 border bg-green-100 text-green-800 border-green-300 uppercase">
                          {acc.status || "active"}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="p-2 border border-[#c4d4ec] text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveAccountDossier(acc)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-[#0E498C] text-white rounded hover:bg-[#00A2E8] shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1 border border-[#00B5E2]/40"
                            title="View Account Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          {onNavigateToLedger && (
                            <button
                              type="button"
                              onClick={() => onNavigateToLedger(acc.account_no)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-[#0d593f] text-white rounded hover:bg-[#093c2b] shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Open Account Statement (ACLI)"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Statement</span>
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

          {/* Pagination Footer (Order Entry Style) */}
          {!loading && filteredAccounts.length > 0 && (
            <div className="bg-[#f8fafc] border-t border-[#c4d4ec] p-2.5 px-4 flex flex-wrap items-center justify-between gap-3 text-[12px] text-gray-700 select-none">
              {/* Record Range & Page Size */}
              <div className="flex items-center gap-3">
                <span className="text-gray-600">
                  Showing <b className="text-[#104080]">{startRecord}</b> to <b className="text-[#104080]">{endRecord}</b> of{" "}
                  <b className="text-gray-900">{filteredAccounts.length}</b> accounts
                </span>
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-[11px] text-gray-500 font-bold">Rows:</span>
                  <div className="w-[80px]">
                    <FinacleSelect
                      value={String(pageSize)}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      options={pageSizeOptions}
                      searchable={false}
                      triggerClassName="!h-[28px] !py-0.5 text-xs font-bold bg-white border border-[#c4d4ec] rounded px-2"
                    />
                  </div>
                </div>
              </div>

              {/* Page Navigation Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="px-2.5 py-1 border border-[#c4d4ec] bg-white text-[#104080] font-bold rounded hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[11px] cursor-pointer shadow-2xs"
                  title="First Page"
                >
                  &laquo; First
                </button>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 border border-[#c4d4ec] bg-white text-[#104080] font-bold rounded hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[11px] cursor-pointer shadow-2xs"
                  title="Previous Page"
                >
                  &lsaquo; Prev
                </button>

                <span className="px-3 py-1 font-bold text-[#104080] bg-white border border-[#c4d4ec] rounded text-[11px] shadow-2xs">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 border border-[#c4d4ec] bg-white text-[#104080] font-bold rounded hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[11px] cursor-pointer shadow-2xs"
                  title="Next Page"
                >
                  Next &rsaquo;
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-2.5 py-1 border border-[#c4d4ec] bg-white text-[#104080] font-bold rounded hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[11px] cursor-pointer shadow-2xs"
                  title="Last Page"
                >
                  Last &raquo;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Account Detail Dossier Modal */}
      {activeAccountDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-gray-300 shadow-2xl max-w-2xl w-full overflow-hidden text-xs flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#104080] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Landmark className="w-5 h-5 text-blue-200" />
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wide">
                    Finacle Account Dossier
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Scheme: {SCHEME_CONFIG[resolveAccountScheme(activeAccountDossier.account_type, activeAccountDossier.account_no)]?.label || "General Ledger"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveAccountDossier(null)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
              {/* Account Number Ribbon */}
              <div className="bg-[#104080] text-white p-4 rounded-lg flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">
                    Core Banking Account Number
                  </div>
                  <div className="font-mono text-2xl font-black text-amber-300 tracking-wider my-0.5 select-all">
                    {activeAccountDossier.account_no || "N/A"}
                  </div>
                  <div className="text-[11px] text-blue-100 font-mono">
                    IFSC: {activeAccountDossier.ifsc_code || "CNRB0001020"} | Branch:{" "}
                    {activeAccountDossier.branch === "UAE" ? "Dubai (AED)" : "India (INR)"}
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="inline-flex items-center gap-1 bg-white/20 text-white border border-white/30 font-bold px-2.5 py-1 rounded text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{activeAccountDossier.status || "ACTIVE"}</span>
                  </span>
                  <div className="text-[10px] text-blue-200">
                    Value Date: {activeAccountDossier.opening_date || "—"}
                  </div>
                </div>
              </div>

              {/* Primary Identity Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="text-[11px] font-bold text-[#104080] uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#104080]" />
                  <span>Account Legal Ownership &amp; Primary Linkage</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Legal Account Title</div>
                    <div className="font-bold text-gray-900 text-sm mt-0.5 uppercase tracking-wide">
                      {activeAccountDossier.name ? activeAccountDossier.name.toUpperCase() : "N/A"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Primary Master CIF</div>
                    <div className="font-mono font-bold text-[#104080] text-sm mt-0.5">
                      {activeAccountDossier.cif_no || (activeAccountDossier.party_id ? `CIF #${activeAccountDossier.party_id}` : "Unlinked")}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Registered Mobile</div>
                    <div className="font-mono text-gray-800 text-xs mt-0.5">
                      {activeAccountDossier.phone || "Not recorded"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Registered City / Office</div>
                    <div className="text-gray-800 text-xs mt-0.5">
                      {activeAccountDossier.city || "Urban Metropolitan"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Parameters */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="text-[11px] font-bold text-[#104080] uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#104080]" />
                  <span>Financial Provisions &amp; Limit Structure</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Scheme Classification</div>
                    <div className="font-bold text-gray-800 text-xs mt-0.5">
                      [{SCHEME_CONFIG[resolveAccountScheme(activeAccountDossier.account_type, activeAccountDossier.account_no)]?.code || "GL"}]{" "}
                      {SCHEME_CONFIG[resolveAccountScheme(activeAccountDossier.account_type, activeAccountDossier.account_no)]?.label || "General Ledger"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Initial Operating Deposit</div>
                    <div className="font-mono font-bold text-emerald-700 text-xs mt-0.5">
                      {activeAccountDossier.branch === "UAE" ? "AED" : "₹"}{" "}
                      {Number(activeAccountDossier.initial_deposit || 0).toLocaleString()}
                    </div>
                  </div>

                  {resolveAccountScheme(activeAccountDossier.account_type, activeAccountDossier.account_no) === "BORROWED" && (
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase">Sanctioned Limit (ODA)</div>
                      <div className="font-mono font-bold text-amber-700 text-xs mt-0.5">
                        {activeAccountDossier.branch === "UAE" ? "AED" : "₹"}{" "}
                        {Number(activeAccountDossier.sanctioned_limit || 0).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {activeAccountDossier.wallet && (
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase">Current Ledger Balance</div>
                      <div className="font-mono font-bold text-blue-800 text-xs mt-0.5">
                        {activeAccountDossier.branch === "UAE" ? "AED" : "₹"}{" "}
                        {Number(activeAccountDossier.wallet.bank_balance || 0).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Servicer Settlement Accounts if applicable */}
              {activeAccountDossier.bank_accounts && activeAccountDossier.bank_accounts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                    Registered External Settlement Accounts ({activeAccountDossier.bank_accounts.length})
                  </div>
                  <div className="border border-gray-200 rounded overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-gray-600 text-[10px] font-bold uppercase">
                        <tr>
                          <th className="py-1.5 px-3">Bank Name</th>
                          <th className="py-1.5 px-3">Account Number</th>
                          <th className="py-1.5 px-3">IFSC</th>
                          <th className="py-1.5 px-3">Account Holder</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {activeAccountDossier.bank_accounts.map((b: any, bIdx: number) => (
                          <tr key={bIdx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-semibold">{b.bank_name}</td>
                            <td className="py-1.5 px-3 font-mono">{b.account_number}</td>
                            <td className="py-1.5 px-3 font-mono text-gray-500">{b.ifsc_code}</td>
                            <td className="py-1.5 px-3 text-gray-700">{b.account_holder}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-gray-200 px-5 py-3 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-gray-500 font-mono">
                System Record ID: {activeAccountDossier.id}
              </span>
              <div className="flex items-center gap-2">
                {onNavigateToLedger && (
                  <button
                    type="button"
                    onClick={() => {
                      const accNo = activeAccountDossier.account_no;
                      setActiveAccountDossier(null);
                      onNavigateToLedger(accNo);
                    }}
                    className="bg-[#0d593f] hover:bg-[#093c2b] text-white px-3.5 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Open Account Statement (ACLI)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveAccountDossier(null)}
                  className="bg-[#104080] hover:bg-[#1a559e] text-white px-4 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
