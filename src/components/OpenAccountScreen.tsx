import React, { useState, useEffect } from "react";
import api from "../services/api";
import FinacleDatePicker from "./FinacleDatePicker";
import FinacleSelect from "./FinacleSelect";
import {
  Building2,
  User,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Wallet,
  Landmark,
  PiggyBank,
  Briefcase,
  Scale,
  ChevronRight,
  Check,
  ArrowRight,
  Globe,
  X,
  Copy,
  Users,
  TrendingUp,
  Receipt,
  BadgeCheck
} from "lucide-react";

function formatAmountInWords(num: number, branch: "INDIA" | "UAE"): string {
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

  const unit = branch === "UAE" ? "Dirhams" : "Rupees";
  return `${unit} ${result.trim()} Only`;
}

function formatDateToDisplay(isoStr?: string): string {
  if (!isoStr) return "";
  const parts = isoStr.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
}

export type AccountType =
  | "SAVINGS"
  | "SALARY"
  | "CURRENT"
  | "CORPORATE_SINGLE"
  | "CORPORATE_JOINT"
  | "PROFIT"
  | "EXPENSE"
  | "BORROWED"
  | "SERVICER";

export interface ServicerBankAccount {
  id?: string;
  account_holder?: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  branch_name?: string;
  account_type: "Savings" | "Current";
  is_primary: boolean;
}

export interface EligibleCif {
  id: string | number;
  cif_no: string;
  first_name: string;
  last_name: string;
  contact_number?: string;
  indian_number?: string;
  city?: string;
  country?: string;
  photo_url?: string;
  branch_id?: string | number;
  existing_servicer_id?: string | number;
}

interface OpenAccountScreenProps {
  onNavigate?: (screen: string) => void;
}

export default function OpenAccountScreen({ onNavigate }: OpenAccountScreenProps) {
  // Value / Account Opening Date (First Parameter)
  const [openingDate, setOpeningDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Scheme Selection
  const [accountType, setAccountType] = useState<AccountType>("SAVINGS");

  // CIF Selection
  const [eligibleCifs, setEligibleCifs] = useState<EligibleCif[]>([]);
  const [loadingCifs, setLoadingCifs] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState<string>("");

  // Base Identity Fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [branch, setBranch] = useState<"INDIA" | "UAE">("INDIA");

  // Scheme Financial Parameters
  const [initialDeposit, setInitialDeposit] = useState<number | "">("");
  const [sanctionedLimit, setSanctionedLimit] = useState<number | "">("");
  const [jointHolderName, setJointHolderName] = useState("");

  // Scheme D: Servicer (SRV) Settlement Accounts
  const [bankAccounts, setBankAccounts] = useState<ServicerBankAccount[]>([]);
  const [editingBankIndex, setEditingBankIndex] = useState<number | null>(null);
  const [entryAccountHolder, setEntryAccountHolder] = useState("");
  const [entryAccountNumber, setEntryAccountNumber] = useState("");
  const [entryIfsc, setEntryIfsc] = useState("");
  const [entryBankName, setEntryBankName] = useState("");
  const [entryBranchName, setEntryBranchName] = useState("");
  const [entryAccountType, setEntryAccountType] = useState<"Savings" | "Current">("Current");
  const [entryError, setEntryError] = useState("");
  const [lookingUpIfsc, setLookingUpIfsc] = useState(false);

  // Processing & Success State
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [createdResult, setCreatedResult] = useState<{
    account_no: string;
    scheme_code: string;
    scheme_type: string;
    branch: string;
    ifsc: string;
    name: string;
    servicer_code?: string;
    cif_no?: string;
    opening_date?: string;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedIfsc, setCopiedIfsc] = useState(false);

  const handleCopyAccountNo = () => {
    if (createdResult?.account_no) {
      navigator.clipboard.writeText(createdResult.account_no);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyIfsc = () => {
    if (createdResult?.ifsc) {
      navigator.clipboard.writeText(createdResult.ifsc);
      setCopiedIfsc(true);
      setTimeout(() => setCopiedIfsc(false), 2000);
    }
  };

  // Scheme Configuration Metadata
  const schemeDetails: Record<
    AccountType,
    {
      code: string;
      codeBadge: string;
      label: string;
      title: string;
      desc: string;
      icon: React.ReactNode;
      accentBg: string;
      accentText: string;
    }
  > = {
    SAVINGS: {
      code: "1020",
      codeBadge: "SBA",
      label: "Savings Account",
      title: "SAVINGS BANK ACCOUNT (SBA)",
      desc: "Personal interest-bearing demand deposit account with cheque and ATM withdrawal facility.",
      icon: <PiggyBank className="w-4 h-4" />,
      accentBg: "bg-emerald-50",
      accentText: "text-emerald-700"
    },
    SALARY: {
      code: "1050",
      codeBadge: "SAL",
      label: "Salary Account",
      title: "SALARY PACKAGE ACCOUNT (SAL)",
      desc: "Zero-balance corporate payroll and employee compensation account.",
      icon: <BadgeCheck className="w-4 h-4" />,
      accentBg: "bg-teal-50",
      accentText: "text-teal-700"
    },
    CURRENT: {
      code: "1030",
      codeBadge: "CAA",
      label: "Current Account",
      title: "CURRENT COMMERCIAL ACCOUNT (CAA)",
      desc: "Commercial demand deposit account with unrestricted turnover and liquidity management.",
      icon: <Briefcase className="w-4 h-4" />,
      accentBg: "bg-blue-50",
      accentText: "text-blue-700"
    },
    CORPORATE_SINGLE: {
      code: "1060",
      codeBadge: "CAP-S",
      label: "Corporate Account - Single",
      title: "CORPORATE ACCOUNT - SINGLE OPERATING (CAP-S)",
      desc: "Corporate business account operated solely by a primary authorized signatory.",
      icon: <Building2 className="w-4 h-4" />,
      accentBg: "bg-indigo-50",
      accentText: "text-indigo-700"
    },
    CORPORATE_JOINT: {
      code: "1070",
      codeBadge: "CAP-J",
      label: "Corporate Account - Joint",
      title: "CORPORATE ACCOUNT - JOINT OPERATING (CAP-J)",
      desc: "Corporate commercial account operated jointly by dual authorized signatories.",
      icon: <Users className="w-4 h-4" />,
      accentBg: "bg-cyan-50",
      accentText: "text-cyan-700"
    },
    PROFIT: {
      code: "2010",
      codeBadge: "PFT",
      label: "Profit Account",
      title: "PROFIT ACCRUAL & TREASURY POOL (PFT)",
      desc: "Internal GL pool ledger for retained corporate earnings and treasury surplus.",
      icon: <TrendingUp className="w-4 h-4" />,
      accentBg: "bg-emerald-50",
      accentText: "text-emerald-700"
    },
    EXPENSE: {
      code: "2020",
      codeBadge: "EXP",
      label: "Expense Account",
      title: "OPERATING EXPENSE DISBURSAL (EXP)",
      desc: "Operational expenditure float for vendor disbursements, petty cash, and utilities.",
      icon: <Receipt className="w-4 h-4" />,
      accentBg: "bg-rose-50",
      accentText: "text-rose-700"
    },
    BORROWED: {
      code: "1040",
      codeBadge: "ODA",
      label: "Overdraft / Borrowed",
      title: "BORROWED / OVERDRAFT FACILITY (ODA)",
      desc: "Revolving credit line allowing account balances to operate into negative up to the sanctioned limit.",
      icon: <Scale className="w-4 h-4" />,
      accentBg: "bg-purple-50",
      accentText: "text-purple-700"
    },
    SERVICER: {
      code: "1010",
      codeBadge: "SRV",
      label: "Servicer Float Wallet",
      title: "SERVICER OPERATING FLOAT WALLET (SRV)",
      desc: "Dedicated disbursement and working float ledger linked to external CDM & corporate settlement bank accounts.",
      icon: <Wallet className="w-4 h-4" />,
      accentBg: "bg-amber-50",
      accentText: "text-amber-800"
    }
  };

  const schemeCode = schemeDetails[accountType].code;
  const clearingIfsc = branch === "UAE" ? "FNCL0000971" : "FNCL0000091";
  const currencySymbol = branch === "UAE" ? "AED" : "₹";

  const fetchEligibleCifs = async () => {
    try {
      setLoadingCifs(true);
      const res = await api.get("/payouts/eligible-cifs");
      const list = Array.isArray(res.data) ? res.data : (res.data?.cifs || []);
      setEligibleCifs(list);
    } catch {
      setEligibleCifs([]);
    } finally {
      setLoadingCifs(false);
    }
  };

  useEffect(() => {
    fetchEligibleCifs();
  }, []);

  const handleSelectCif = (partyId: string) => {
    setSelectedPartyId(partyId);
    if (!partyId) {
      setName("");
      setPhone("");
      setCity("");
      setEntryAccountHolder("");
      return;
    }
    const cif = eligibleCifs.find((c) => String(c.id) === String(partyId));
    if (cif) {
      const fullName = [cif.first_name, cif.last_name].filter(Boolean).join(" ");
      setName(fullName);
      setPhone(cif.contact_number || cif.indian_number || "");
      setCity(cif.city || (cif.country === "UAE" ? "Dubai" : "Mumbai"));
      setEntryAccountHolder(fullName);
    }
  };

  const handleIfscLookup = async (code: string) => {
    const clean = code.toUpperCase().trim();
    setEntryIfsc(clean);
    setEntryError("");
    if (clean.length === 11) {
      setLookingUpIfsc(true);
      try {
        const res = await fetch(`https://ifsc.razorpay.com/${clean}`);
        if (res.ok) {
          const data = await res.json();
          setEntryBankName(data.BANK || "");
          setEntryBranchName(data.BRANCH || "");
        } else {
          setEntryError("IFSC code not found in National Clearing directory. Please verify code or enter bank manually.");
        }
      } catch {
        // Fallback for custom or test IFSC
      } finally {
        setLookingUpIfsc(false);
      }
    }
  };

  const handleAddOrUpdateBankAccount = () => {
    setEntryError("");
    const accNum = entryAccountNumber.trim();
    const ifsc = entryIfsc.trim().toUpperCase();
    const bName = entryBankName.trim();

    if (!accNum) {
      setEntryError("Settlement Account Number is required.");
      return;
    }
    if (!ifsc) {
      setEntryError("IFSC Code is required.");
      return;
    }
    if (!bName) {
      setEntryError("Bank Name is required.");
      return;
    }

    const newAcc: ServicerBankAccount = {
      account_holder: entryAccountHolder.trim() || name.trim(),
      bank_name: bName,
      account_number: accNum,
      ifsc_code: ifsc,
      branch_name: entryBranchName.trim(),
      account_type: entryAccountType,
      is_primary: bankAccounts.length === 0 || (editingBankIndex !== null && bankAccounts[editingBankIndex].is_primary)
    };

    if (editingBankIndex !== null) {
      const updated = [...bankAccounts];
      updated[editingBankIndex] = newAcc;
      setBankAccounts(updated);
      setEditingBankIndex(null);
    } else {
      setBankAccounts([...bankAccounts, newAcc]);
    }

    setEntryAccountNumber("");
    setEntryIfsc("");
    setEntryBankName("");
    setEntryBranchName("");
    setEntryAccountType("Current");
  };

  const handleEditBank = (idx: number) => {
    const acc = bankAccounts[idx];
    setEditingBankIndex(idx);
    setEntryAccountHolder(acc.account_holder || name);
    setEntryAccountNumber(acc.account_number);
    setEntryIfsc(acc.ifsc_code);
    setEntryBankName(acc.bank_name);
    setEntryBranchName(acc.branch_name || "");
    setEntryAccountType(acc.account_type);
    setEntryError("");
  };

  const handleDeleteBank = (idx: number) => {
    const wasPrimary = bankAccounts[idx].is_primary;
    const remaining = bankAccounts.filter((_, i) => i !== idx);
    if (wasPrimary && remaining.length > 0) {
      remaining[0].is_primary = true;
    }
    setBankAccounts(remaining);
    if (editingBankIndex === idx) {
      setEditingBankIndex(null);
      setEntryAccountNumber("");
      setEntryIfsc("");
      setEntryBankName("");
      setEntryBranchName("");
    }
  };

  const handleSetPrimaryBank = (idx: number) => {
    setBankAccounts(bankAccounts.map((b, i) => ({ ...b, is_primary: i === idx })));
  };

  const handleResetForm = () => {
    setOpeningDate(new Date().toISOString().slice(0, 10));
    setSelectedPartyId("");
    setName("");
    setPhone("");
    setCity("");
    setBranch("INDIA");
    setInitialDeposit("");
    setSanctionedLimit("");
    setJointHolderName("");
    setBankAccounts([]);
    setEditingBankIndex(null);
    setEntryAccountNumber("");
    setEntryIfsc("");
    setEntryBankName("");
    setEntryBranchName("");
    setFormError("");
    setCreatedResult(null);
    setShowSuccessModal(false);
  };

  const handleOpenAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Primary Account Holder Name / Legal Title is required.");
      return;
    }

    if (accountType === "BORROWED" && (!sanctionedLimit || Number(sanctionedLimit) <= 0)) {
      setFormError("Sanctioned Credit Limit must be greater than zero for Overdraft / Loan scheme.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    const validBankAccounts = bankAccounts.filter(
      (b) => b.account_number.trim() || b.bank_name.trim() || b.ifsc_code.trim()
    );

    const primaryName = name.trim();
    const finalLegalTitle =
      accountType === "CORPORATE_JOINT" && jointHolderName.trim()
        ? `${primaryName} & ${jointHolderName.trim()}`
        : primaryName;

    try {
      const res = await api.post("/payouts/servicers", {
        party_id: selectedPartyId ? selectedPartyId : undefined,
        name: finalLegalTitle,
        phone: phone.trim() || undefined,
        city: city.trim() || (branch === "UAE" ? "Dubai" : "Mumbai"),
        branch: branch,
        bank_accounts: accountType === "SERVICER" ? validBankAccounts : [],
        account_type: accountType,
        sanctioned_limit: accountType === "BORROWED" ? Number(sanctionedLimit) || 0 : 0,
        initial_deposit: (accountType !== "BORROWED" && accountType !== "SERVICER") ? Number(initialDeposit) || 0 : 0,
        opening_date: openingDate
      });

      const data = res.data;
      const servicer = data.servicer || data;
      setCreatedResult({
        account_no: servicer.account_no || data.account_no || "A/C GENERATED",
        scheme_code: schemeCode,
        scheme_type: schemeDetails[accountType].title,
        branch: servicer.branch || branch,
        ifsc: servicer.ifsc_code || data.ifsc_code || clearingIfsc,
        name: servicer.name || name.trim(),
        servicer_code: servicer.servicer_code || data.servicer_code,
        cif_no: servicer.cif_no || selectedCifObj?.cif_no,
        opening_date: openingDate
      });
      setShowSuccessModal(true);
      fetchEligibleCifs();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || "Failed to provision account");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCifObj = eligibleCifs.find((c) => String(c.id) === String(selectedPartyId));

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden text-xs select-none">
      {/* 1. Page Title Header */}
      <div className="bg-white px-5 md:px-8 py-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <Landmark className="w-5 h-5 text-[#104080]" />
            <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
              Open Account Onboarding Desk (OAAC)
            </h1>
            <span className="bg-blue-50 text-[#104080] border border-blue-200 px-2 py-0.5 rounded text-xs font-mono font-bold tracking-wide">
              SCHEME: {schemeDetails[accountType].codeBadge} ({schemeCode})
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 ml-7">
            Core Banking Universal Account Opening • Scheme Provisioning & CIF Linkage
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {accountType === "SERVICER" && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate("SERVICER WALLETS")}
              className="flex items-center gap-1.5 bg-[#104080] hover:bg-[#1a559e] text-white px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-300" />
              <span>Servicer Passbook</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleResetForm}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors border border-gray-300 shadow-2xs"
          >
            <RefreshCw className="w-3 h-3 text-gray-600" />
            <span>Reset Form</span>
          </button>
        </div>
      </div>

      {/* 2. Main Workspace Area - Generous Breathing Room */}
      <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar bg-slate-50/60">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Error Banner */}
          {formError && (
            <div className="bg-red-50 border-l-4 border-red-600 p-3.5 rounded-md flex items-center gap-2.5 text-red-800 text-xs shadow-xs">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-bold">{formError}</span>
            </div>
          )}

          <form onSubmit={handleOpenAccount} className="space-y-6">
            {/* Account Classification & Operating Branch Parameters (Native Form Card) */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-xs">
              <div className="bg-slate-50/80 border-b border-gray-200 px-5 py-3.5 flex items-center justify-between rounded-t-lg">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#104080]" />
                  <span className="font-bold text-sm text-[#104080] uppercase tracking-wide">
                    Account Classification &amp; Operating Branch
                  </span>
                </div>
                <span className="text-xs bg-blue-50 text-[#104080] border border-blue-100 font-bold px-2.5 py-1 rounded font-mono">
                  SCHEME CODE: {schemeCode} • CURRENCY: {currencySymbol}
                </span>
              </div>

              <div className="p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. Account Opening Date (First Option) */}
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                    <span>Account Opening Date: *</span>
                    <span className="text-[11px] font-normal text-gray-500">Value Date</span>
                  </label>
                  <FinacleDatePicker
                    value={openingDate}
                    onChange={(e) => setOpeningDate(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-semibold text-gray-900 shadow-2xs hover:border-gray-400 focus-within:border-[#104080] focus-within:ring-1 focus-within:ring-[#104080] flex items-center justify-between min-h-[38px]"
                  />
                </div>

                {/* 2. Select Account Scheme */}
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Select Account Scheme: *
                  </label>
                  <FinacleSelect<AccountType>
                    value={accountType}
                    onChange={(e) => {
                      setAccountType(e.target.value as AccountType);
                      setFormError("");
                    }}
                    accentClass="text-[#104080]"
                    options={[
                      { value: "SAVINGS", label: "Savings Account (SBA)", badge: "1020" },
                      { value: "SALARY", label: "Salary Account (SAL)", badge: "1050" },
                      { value: "CURRENT", label: "Current Account (CAA)", badge: "1030" },
                      { value: "CORPORATE_SINGLE", label: "Corporate Account - Single (CAP-S)", badge: "1060" },
                      { value: "CORPORATE_JOINT", label: "Corporate Account - Joint (CAP-J)", badge: "1070" },
                      { value: "PROFIT", label: "Profit Account (PFT)", badge: "2010" },
                      { value: "EXPENSE", label: "Expense Account (EXP)", badge: "2020" },
                      { value: "BORROWED", label: "Overdraft / Loan (ODA)", badge: "1040" },
                      { value: "SERVICER", label: "Servicer Float (SRV)", badge: "1010" }
                    ]}
                  />
                </div>

                {/* 3. Select Operating Branch */}
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Operating Branch: *
                  </label>
                  <FinacleSelect<"INDIA" | "UAE">
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    accentClass="text-gray-900"
                    options={[
                      { value: "INDIA", label: "India Clearing Branch (INR - ₹)" },
                      { value: "UAE", label: "UAE Dubai Regional Branch (AED)" }
                    ]}
                  />
                </div>

                {/* 4. Clearing IFSC Code */}
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Clearing IFSC Code:
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={clearingIfsc}
                    className="w-full bg-slate-50 border border-gray-300 rounded-md px-3 py-2 text-xs font-mono font-bold text-[#104080] focus:outline-none cursor-default min-h-[38px]"
                  />
                </div>
              </div>
            </div>

            {/* 2-COLUMN BALANCED WORKSPACE: LEFT (CIF) & RIGHT (SCHEME PARAMS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* SECTION 1: MASTER CIF LINKAGE (5 COLS) */}
              <div className="lg:col-span-5 bg-white border border-gray-200 rounded-lg shadow-xs">
                <div className="bg-slate-50/80 border-b border-gray-200 px-5 py-3.5 flex items-center justify-between rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#104080]" />
                    <span className="font-bold text-sm text-[#104080] uppercase tracking-wide">
                      1. Master CIF Linkage
                    </span>
                  </div>
                  <span className="text-xs bg-blue-50 text-[#104080] border border-blue-100 font-bold px-2.5 py-1 rounded flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> KYC Master
                  </span>
                </div>

                <div className="p-5 md:p-6 space-y-5">
                  <div>
                    <label className="block text-[13px] font-bold text-[#104080] mb-1.5">
                      Select Verified CIF (Retail Customer / Servicer):
                    </label>
                    <FinacleSelect
                      value={selectedPartyId}
                      onChange={(e) => handleSelectCif(e.target.value)}
                      disabled={loadingCifs}
                      placeholder={loadingCifs ? "Loading Verified CIFs..." : "-- Choose Verified CIF or Enter Profile Manually --"}
                      options={[
                        { value: "", label: "-- Choose Verified CIF or Enter Profile Manually --" },
                        ...eligibleCifs.map((c) => ({
                          value: String(c.id),
                          label: `${c.cif_no} — ${c.first_name} ${c.last_name}`,
                          subLabel: c.contact_number ? `Contact: ${c.contact_number}` : undefined
                        }))
                      ]}
                    />
                    {selectedPartyId ? (
                      <div className="text-xs text-emerald-700 font-semibold mt-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Linked to Retail CIF {selectedCifObj?.cif_no}. Full profile inherited.</span>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 mt-1.5">
                        Select an onboarding CIF or type primary account holder details below.
                      </div>
                    )}
                  </div>

                  {/* Profile Inputs */}
                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                        Primary Account Holder Legal Title: *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter full legal name or commercial entity title"
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#104080] focus:ring-1 focus:ring-[#104080]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                        Contact Phone:
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210 / +971 50 123 4567"
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#104080] focus:ring-1 focus:ring-[#104080]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: SCHEME SPECIFICATIONS (7 COLS) */}
              <div className="lg:col-span-7 bg-white border border-gray-200 rounded-lg shadow-xs">
                <div className="bg-slate-50/80 border-b border-gray-200 px-5 py-3.5 flex items-center justify-between rounded-t-lg">
                  <div className="flex items-center gap-2">
                    {schemeDetails[accountType].icon}
                    <span className="font-bold text-sm text-[#104080] uppercase tracking-wide">
                      2. {schemeDetails[accountType].title}
                    </span>
                  </div>
                  <span className="text-xs bg-blue-50 text-[#104080] border border-blue-100 font-bold px-2.5 py-1 rounded font-mono">
                    SCHEME CODE: {schemeCode}
                  </span>
                </div>

                <div className="p-5 md:p-6 space-y-5">
                  
                  {/* SCHEME: SAVINGS, SALARY, CURRENT, CORPORATE SINGLE, PROFIT, EXPENSE */}
                  {(accountType === "SAVINGS" ||
                    accountType === "SALARY" ||
                    accountType === "CURRENT" ||
                    accountType === "CORPORATE_SINGLE" ||
                    accountType === "PROFIT" ||
                    accountType === "EXPENSE") && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[13px] font-bold text-[#104080] mb-1.5">
                          {accountType === "SAVINGS" && `Initial Opening Deposit (${currencySymbol}):`}
                          {accountType === "SALARY" && `Initial Salary Credit (${currencySymbol} - Optional Zero Balance):`}
                          {accountType === "CURRENT" && `Initial Operating Deposit (${currencySymbol}):`}
                          {accountType === "CORPORATE_SINGLE" && `Corporate Initial Deposit (${currencySymbol}):`}
                          {accountType === "PROFIT" && `Initial Profit Reserve Allocation (${currencySymbol}):`}
                          {accountType === "EXPENSE" && `Initial Operating Expense Float (${currencySymbol}):`}
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 font-bold text-gray-500 text-xs">
                            {currencySymbol}
                          </span>
                          <input
                            type="number"
                            value={initialDeposit}
                            onChange={(e) => setInitialDeposit(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="0.00"
                            className="w-full bg-white border border-gray-300 rounded-md pl-8 pr-3 py-2 text-xs font-bold text-[#104080] focus:outline-none focus:border-[#104080] focus:ring-1 focus:ring-[#104080]"
                          />
                        </div>
                        {Number(initialDeposit) > 0 && (
                          <div className="text-xs font-semibold text-emerald-700 mt-1.5 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{formatAmountInWords(Number(initialDeposit), branch)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SCHEME: CORPORATE ACCOUNT - JOINT OPERATING */}
                  {accountType === "CORPORATE_JOINT" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[13px] font-bold text-[#104080] mb-1.5">
                          Corporate Initial Deposit ({currencySymbol}):
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 font-bold text-gray-500 text-xs">
                            {currencySymbol}
                          </span>
                          <input
                            type="number"
                            value={initialDeposit}
                            onChange={(e) => setInitialDeposit(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="0.00"
                            className="w-full bg-white border border-gray-300 rounded-md pl-8 pr-3 py-2 text-xs font-bold text-[#104080] focus:outline-none focus:border-[#104080] focus:ring-1 focus:ring-[#104080]"
                          />
                        </div>
                        {Number(initialDeposit) > 0 && (
                          <div className="text-xs font-semibold text-emerald-700 mt-1.5 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{formatAmountInWords(Number(initialDeposit), branch)}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                          Secondary Joint Signatory / Co-Applicant Legal Title: *
                        </label>
                        <input
                          type="text"
                          value={jointHolderName}
                          onChange={(e) => setJointHolderName(e.target.value)}
                          placeholder="Enter second authorized signatory name"
                          className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#104080] focus:ring-1 focus:ring-[#104080]"
                          required
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Account will be registered jointly as: <span className="font-bold text-gray-800">{name.trim() || "[Primary Name]"} &amp; {jointHolderName.trim() || "[Secondary Signatory]"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SCHEME C: BORROWED / OVERDRAFT ACCOUNT (ODA) */}
                  {accountType === "BORROWED" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[13px] font-bold text-[#104080] mb-1.5">
                          Sanctioned Credit Limit ({currencySymbol}): *
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 font-bold text-gray-500 text-xs">
                            {currencySymbol}
                          </span>
                          <input
                            type="number"
                            value={sanctionedLimit}
                            onChange={(e) => setSanctionedLimit(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="Enter credit limit"
                            className="w-full bg-white border border-gray-300 rounded-md pl-8 pr-3 py-2 text-xs font-extrabold text-[#104080] focus:outline-none focus:border-[#104080] focus:ring-1 focus:ring-[#104080]"
                            required
                          />
                        </div>
                      </div>

                      {Number(sanctionedLimit) > 0 && (
                        <div className="text-xs font-semibold text-purple-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>Drawing Power: {formatAmountInWords(Number(sanctionedLimit), branch)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SCHEME D: SERVICER FLOAT WALLET (SRV) */}
                  {accountType === "SERVICER" && (
                    <div className="space-y-4">
                      {/* Sub-form */}
                      <div className="bg-slate-50/70 border border-slate-200 p-4 rounded-lg space-y-4">
                        <div className="text-[13px] font-bold text-[#104080] flex items-center justify-between">
                          <span>
                            {editingBankIndex !== null
                              ? "Edit Settlement Account"
                              : "Register Corporate Settlement Account (For ATM / CDM & RTGS Float):"}
                          </span>
                          {editingBankIndex !== null && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBankIndex(null);
                                setEntryAccountNumber("");
                                setEntryIfsc("");
                                setEntryBankName("");
                                setEntryBranchName("");
                              }}
                              className="text-xs text-red-600 hover:underline cursor-pointer font-bold"
                            >
                              Cancel Edit
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                              Bank Account Number: *
                            </label>
                            <input
                              type="text"
                              value={entryAccountNumber}
                              onChange={(e) => setEntryAccountNumber(e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#104080] focus:ring-1 focus:ring-[#104080]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                              IFSC Code (11 Characters): *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                maxLength={11}
                                value={entryIfsc}
                                onChange={(e) => handleIfscLookup(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-mono font-bold uppercase text-[#104080] focus:outline-none focus:border-[#104080] focus:ring-1 focus:ring-[#104080]"
                              />
                              {lookingUpIfsc && (
                                <RefreshCw className="w-3.5 h-3.5 text-[#104080] animate-spin absolute right-3 top-2.5" />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                              Bank Name: *
                            </label>
                            <input
                              type="text"
                              value={entryBankName}
                              onChange={(e) => setEntryBankName(e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#104080] focus:ring-1 focus:ring-[#104080]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                              Branch / Clearing Office:
                            </label>
                            <input
                              type="text"
                              value={entryBranchName}
                              onChange={(e) => setEntryBranchName(e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#104080] focus:ring-1 focus:ring-[#104080]"
                            />
                          </div>
                        </div>

                        {entryError && (
                          <div className="text-xs text-amber-800 font-bold bg-amber-50 p-2 border border-amber-200 rounded-md">
                            {entryError}
                          </div>
                        )}

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={handleAddOrUpdateBankAccount}
                            className="flex items-center gap-1.5 bg-[#104080] hover:bg-[#1a559e] text-white px-4 py-2 rounded-md text-xs font-bold shadow-xs cursor-pointer transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {editingBankIndex !== null ? "Update Bank Account" : "Add Settlement Account"}
                          </button>
                        </div>
                      </div>

                      {/* Accounts Table */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
                        <table className="w-full border-collapse text-left">
                          <thead>
                            <tr className="bg-slate-50/80 border-b border-gray-200 text-xs font-bold text-[#104080]">
                              <th className="p-3 w-16 text-center">Primary</th>
                              <th className="p-3">Bank Name</th>
                              <th className="p-3">Account Number</th>
                              <th className="p-3">IFSC Code</th>
                              <th className="p-3 w-16 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e5e9f0]">
                            {bankAccounts.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-400 italic text-xs">
                                  No external settlement accounts registered yet.
                                </td>
                              </tr>
                            ) : (
                              bankAccounts.map((b, idx) => (
                                <tr key={idx} className={b.is_primary ? "bg-blue-50/40" : "hover:bg-gray-50"}>
                                  <td className="p-3 text-center">
                                    <input
                                      type="radio"
                                      name="primary_bank"
                                      checked={b.is_primary}
                                      onChange={() => handleSetPrimaryBank(idx)}
                                      className="cursor-pointer text-[#104080] focus:ring-0"
                                    />
                                  </td>
                                  <td className="p-3 font-bold text-gray-800">{b.bank_name}</td>
                                  <td className="p-3 font-mono font-bold text-[#104080]">{b.account_number}</td>
                                  <td className="p-3 font-mono text-gray-600">{b.ifsc_code}</td>
                                  <td className="p-3 text-right space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEditBank(idx)}
                                      className="text-blue-700 hover:text-blue-900 cursor-pointer p-1"
                                    >
                                      <Pencil className="w-3.5 h-3.5 inline" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteBank(idx)}
                                      className="text-red-600 hover:text-red-800 cursor-pointer p-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 inline" />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>

            {/* SECTION 3: STICKY BANKING COMMAND BAR (FOOTER) */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 md:px-6 md:py-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                <span className="font-bold text-gray-800">Value Date:</span>
                <span className="font-mono font-bold text-[#104080]">{formatDateToDisplay(openingDate)}</span>
                <span className="text-gray-300">|</span>
                <span className="font-bold text-gray-800">Branch Office:</span>
                <span className="font-mono font-bold text-[#104080] flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#104080]" />
                  <span>{branch === "UAE" ? "Dubai Regional Branch (UAE)" : "India National Branch (IN)"}</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="font-bold text-gray-800">Currency:</span>
                <span className="font-bold text-emerald-800">{currencySymbol}</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-md text-[13px] font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  Clear Form
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2 rounded-md text-[13px] font-bold shadow-md cursor-pointer disabled:opacity-50 transition-all"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Provisioning in Core Ledger...</span>
                    </>
                  ) : (
                    <>
                      <span>Activate & Open Account</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>

      {/* SUCCESS MODAL POPUP (Triggered upon activating account) */}
      {showSuccessModal && createdResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded border border-gray-300 shadow-2xl max-w-lg w-full overflow-hidden text-xs">
            {/* Modal Header */}
            <div className="bg-[#104080] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wide">
                    Account Opened Successfully
                  </h3>
                  <p className="text-xs text-blue-200">
                    Core Banking General Ledger Provisioned
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3.5">
              {/* Account Number & IFSC Highlight Box */}
              <div className="bg-[#104080] text-white p-4.5 rounded-lg text-center shadow-md space-y-3.5">
                {/* Account Number */}
                <div>
                  <div className="text-[11px] uppercase font-bold text-blue-200 tracking-wider">
                    Finacle Account Number
                  </div>
                  <div className="font-mono text-2xl font-black text-amber-300 tracking-widest my-1 select-all">
                    {createdResult.account_no}
                  </div>
                </div>

                {/* Clearing IFSC Code */}
                <div className="pt-2.5 border-t border-blue-400/30">
                  <div className="text-[11px] uppercase font-bold text-blue-200 tracking-wider">
                    Clearing IFSC Code
                  </div>
                  <div className="font-mono text-xl font-black text-emerald-300 tracking-wider my-0.5 select-all">
                    {createdResult.ifsc}
                  </div>
                </div>

                {/* Quick Copy Buttons */}
                <div className="flex items-center justify-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyAccountNo}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Account Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Account No</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyIfsc}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    {copiedIfsc ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>IFSC Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy IFSC</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Detailed Metadata Grid */}
              <div className="bg-white border border-gray-200 rounded p-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 block text-xs font-semibold uppercase">Account Holder Title</span>
                  <span className="font-bold text-gray-900">{createdResult.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs font-semibold uppercase">Target Scheme</span>
                  <span className="font-bold text-[#104080]">{createdResult.scheme_type}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs font-semibold uppercase">Clearing IFSC</span>
                  <span className="font-mono font-bold text-emerald-700">{createdResult.ifsc}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs font-semibold uppercase">Operating Branch</span>
                  <span className="font-bold text-gray-900">
                    {createdResult.branch === "UAE" ? "Dubai Regional Branch (UAE)" : "India National Branch (IN)"}
                  </span>
                </div>
                {createdResult.opening_date && (
                  <div>
                    <span className="text-gray-500 block text-xs font-semibold uppercase">Account Opening Date</span>
                    <span className="font-bold font-mono text-[#104080]">{formatDateToDisplay(createdResult.opening_date)}</span>
                  </div>
                )}
                {createdResult.cif_no && (
                  <div>
                    <span className="text-gray-500 block text-xs font-semibold uppercase">Linked CIF ID</span>
                    <span className="font-mono font-bold text-gray-900">{createdResult.cif_no}</span>
                  </div>
                )}
                {createdResult.servicer_code && (
                  <div>
                    <span className="text-gray-500 block text-xs font-semibold uppercase">Servicer ID</span>
                    <span className="font-mono font-bold text-purple-700">{createdResult.servicer_code}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
              <div>
                {createdResult.servicer_code && onNavigate && (
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      onNavigate("SERVICER WALLETS");
                    }}
                    className="inline-flex items-center gap-1.5 bg-[#104080] hover:bg-[#1a559e] text-white px-3 py-1.5 rounded text-[13px] font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    <Wallet className="w-3.5 h-3.5 text-amber-300" />
                    <span>Servicer Passbook</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-3.5 py-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded text-[13px] font-bold cursor-pointer transition-colors"
                >
                  Open Another Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[13px] font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
