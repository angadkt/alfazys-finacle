import React, { useState, useEffect } from "react";
import api from "../services/api";
import FinacleDatePicker from "./FinacleDatePicker";
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
  FileCheck,
  ChevronRight,
  Check,
  ArrowRight,
  Globe
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

export type AccountType = "SAVINGS" | "CURRENT" | "BORROWED" | "SERVICER";

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
  const [operatingMode, setOperatingMode] = useState<string>("Single (Self-Operated)");

  // Scheme A: Savings (SBA)
  const [initialDeposit, setInitialDeposit] = useState<number | "">("");
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeRelation, setNomineeRelation] = useState("Spouse");
  const [chequeBookRequired, setChequeBookRequired] = useState(false);
  const [debitCardRequired, setDebitCardRequired] = useState(true);

  // Scheme B: Current (CAA)
  const [constitutionType, setConstitutionType] = useState("Sole Proprietorship");
  const [tradeName, setTradeName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [odFacility, setOdFacility] = useState(false);

  // Scheme C: Borrowed / Overdraft (ODA)
  const [facilityType, setFacilityType] = useState("Clean Overdraft Facility");
  const [sanctionedLimit, setSanctionedLimit] = useState<number | "">("");
  const [interestRate, setInterestRate] = useState<number | "">(10.5);
  const [sanctionDate, setSanctionDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [reviewDate, setReviewDate] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [collateralDetails, setCollateralDetails] = useState("");
  const [dpMargin, setDpMargin] = useState<number>(25);

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
  } | null>(null);

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
    CURRENT: {
      code: "1030",
      codeBadge: "CAA",
      label: "Current Account",
      title: "CURRENT COMMERCIAL ACCOUNT (CAA)",
      desc: "Commercial demand deposit account with unrestricted turnover, auto-sweep, and liquidity management.",
      icon: <Briefcase className="w-4 h-4" />,
      accentBg: "bg-blue-50",
      accentText: "text-blue-700"
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
  const accountPattern = branch === "UAE" ? `00971 ${schemeCode} XXXXX` : `0091 ${schemeCode} XXXXXX`;

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
      setTradeName("");
      setEntryAccountHolder("");
      return;
    }
    const cif = eligibleCifs.find((c) => String(c.id) === String(partyId));
    if (cif) {
      const fullName = [cif.first_name, cif.last_name].filter(Boolean).join(" ");
      setName(fullName);
      setPhone(cif.contact_number || cif.indian_number || "");
      setCity(cif.city || (cif.country === "UAE" ? "Dubai" : "Mumbai"));
      setTradeName(`${fullName} Enterprises`);
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
    setSelectedPartyId("");
    setName("");
    setPhone("");
    setCity("");
    setBranch("INDIA");
    setOperatingMode("Single (Self-Operated)");
    setInitialDeposit("");
    setNomineeName("");
    setNomineeRelation("Spouse");
    setChequeBookRequired(false);
    setDebitCardRequired(true);
    setConstitutionType("Sole Proprietorship");
    setTradeName("");
    setTaxId("");
    setOdFacility(false);
    setFacilityType("Clean Overdraft Facility");
    setSanctionedLimit("");
    setInterestRate(10.5);
    setCollateralDetails("");
    setDpMargin(25);
    setBankAccounts([]);
    setEditingBankIndex(null);
    setEntryAccountNumber("");
    setEntryIfsc("");
    setEntryBankName("");
    setEntryBranchName("");
    setFormError("");
    setCreatedResult(null);
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

    try {
      const res = await api.post("/payouts/servicers", {
        party_id: selectedPartyId ? selectedPartyId : undefined,
        name: name.trim(),
        phone: phone.trim() || undefined,
        city: city.trim() || (branch === "UAE" ? "Dubai" : "Mumbai"),
        branch: branch,
        bank_accounts: accountType === "SERVICER" ? validBankAccounts : [],
        account_type: accountType,
        sanctioned_limit: accountType === "BORROWED" ? Number(sanctionedLimit) || 0 : 0,
        initial_deposit: (accountType === "SAVINGS" || accountType === "CURRENT") ? Number(initialDeposit) || 0 : 0
      });

      const data = res.data;
      setCreatedResult({
        account_no: data.account_no || "A/C GENERATED",
        scheme_code: schemeCode,
        scheme_type: schemeDetails[accountType].title,
        branch: branch,
        ifsc: data.ifsc_code || clearingIfsc,
        name: name.trim(),
        servicer_code: data.servicer_code,
        cif_no: selectedCifObj?.cif_no
      });
      fetchEligibleCifs();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || "Failed to provision account");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCifObj = eligibleCifs.find((c) => String(c.id) === String(selectedPartyId));

  return (
    <div className="flex-1 flex flex-col bg-[#d4d0c8] overflow-hidden text-xs select-none">
      {/* 1. Finacle Command Bar Header */}
      <div className="bg-[#104080] text-white px-3.5 py-1.5 flex items-center justify-between border-b border-[#0a2850] shadow-xs shrink-0">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-amber-300" />
          <span className="font-bold tracking-wider text-xs uppercase font-sans">
            CORE BANKING ONBOARDING DESK (OAAC)
          </span>
          <span className="bg-blue-950/80 text-blue-200 border border-blue-600 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wide">
            SCHEME: {schemeDetails[accountType].codeBadge} ({schemeCode})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {accountType === "SERVICER" && onNavigate && (
            <button
              onClick={() => onNavigate("SERVICER WALLETS")}
              className="flex items-center gap-1.5 bg-[#23528f] hover:bg-[#1a4073] text-white px-3 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors shadow-xs"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-300" />
              <span>Servicer Passbook</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleResetForm}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Reset Form
          </button>
        </div>
      </div>

      {/* 2. Top Scheme & Branch Selection Ribbon (No Emojis) */}
      <div className="bg-[#e6edf8] border-b border-[#c4d4ec] px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="text-[#104080] font-extrabold text-[11px] tracking-wide flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-[#104080]" /> SELECT ACCOUNT SCHEME:
          </span>

          <div className="inline-flex rounded border border-[#104080] bg-white p-0.5 shadow-2xs divide-x divide-gray-200">
            {(
              [
                { id: "SAVINGS", label: "Savings Account", code: "SBA", icon: <PiggyBank className="w-3.5 h-3.5" /> },
                { id: "CURRENT", label: "Current Account", code: "CAA", icon: <Briefcase className="w-3.5 h-3.5" /> },
                { id: "BORROWED", label: "Overdraft / Loan", code: "ODA", icon: <Scale className="w-3.5 h-3.5" /> },
                { id: "SERVICER", label: "Servicer Float", code: "SRV", icon: <Wallet className="w-3.5 h-3.5" /> }
              ] as const
            ).map((scheme) => {
              const isActive = accountType === scheme.id;
              return (
                <button
                  key={scheme.id}
                  type="button"
                  onClick={() => {
                    setAccountType(scheme.id);
                    setFormError("");
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#104080] text-white shadow-xs"
                      : "text-[#104080] hover:bg-[#f0f4f8] bg-white"
                  }`}
                >
                  <span className={isActive ? "text-amber-300" : "text-[#104080]"}>
                    {scheme.icon}
                  </span>
                  <span>{scheme.label}</span>
                  <span
                    className={`text-[9.5px] px-1 rounded font-mono font-extrabold ${
                      isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {scheme.code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Operating Branch & National Clearing Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-gray-600 font-bold">Operating Branch:</span>
            <div className="inline-flex rounded border border-gray-300 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setBranch("INDIA")}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                  branch === "INDIA"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Landmark className="w-3 h-3" /> India Clearing (₹)
              </button>
              <button
                type="button"
                onClick={() => setBranch("UAE")}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                  branch === "UAE"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Landmark className="w-3 h-3" /> UAE Clearing (AED)
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#c4d4ec] px-2.5 py-1 rounded flex items-center gap-1.5 shadow-2xs">
            <span className="text-gray-500 font-medium text-[10px]">Clearing IFSC:</span>
            <span className="font-mono font-extrabold text-[#104080] text-[11px]">{clearingIfsc}</span>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace Area */}
      <div className="flex-1 overflow-y-auto p-3.5 custom-scrollbar bg-[#edf1f7]">
        <div className="max-w-6xl mx-auto space-y-3.5">
          {/* Post-Activation Voucher */}
          {createdResult && (
            <div className="bg-emerald-50 border-2 border-emerald-600 rounded-sm p-3.5 shadow-md text-emerald-950 animate-in fade-in duration-200">
              <div className="flex items-start justify-between border-b border-emerald-200 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase text-emerald-950 tracking-wide flex items-center gap-2">
                      <span>FINACLE ACCOUNT OPENED &amp; PROVISIONED SUCCESSFULLY</span>
                      <span className="bg-emerald-700 text-white text-[9.5px] px-2 py-0.5 rounded font-mono">
                        GL ACCREDITED
                      </span>
                    </h3>
                    <p className="text-[11px] text-emerald-800">
                      General Ledger Account registered under {createdResult.scheme_type}.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {createdResult.servicer_code && onNavigate && (
                    <button
                      onClick={() => onNavigate("SERVICER WALLETS")}
                      className="bg-[#104080] hover:bg-[#1a559e] text-white px-3 py-1 rounded text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Servicer Passbook</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={handleResetForm}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1 rounded text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Open Another Account
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white/80 border border-emerald-200 p-2.5 rounded text-xs">
                <div>
                  <span className="text-gray-500 block text-[9.5px] uppercase font-bold">Account Holder Title:</span>
                  <span className="font-extrabold text-gray-900 text-xs">{createdResult.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[9.5px] uppercase font-bold">Finacle Operating A/C:</span>
                  <span className="font-mono font-extrabold text-[#104080] text-sm tracking-wide">
                    {createdResult.account_no}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[9.5px] uppercase font-bold">Clearing IFSC Code:</span>
                  <span className="font-mono font-bold text-emerald-800">{createdResult.ifsc}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[9.5px] uppercase font-bold">Branch Office:</span>
                  <span className="font-bold text-gray-800">
                    {createdResult.branch === "UAE" ? "UAE Dubai Regional Branch" : "India Clearing Branch"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {formError && (
            <div className="bg-red-50 border-l-4 border-red-600 p-2.5 rounded-sm flex items-center gap-2 text-red-800 text-xs shadow-xs">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-bold">{formError}</span>
            </div>
          )}

          <form onSubmit={handleOpenAccount} className="space-y-3.5">
            {/* 2-COLUMN BALANCED WORKSPACE: LEFT (CIF) & RIGHT (SCHEME PARAMS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
              
              {/* SECTION 1: MASTER CIF LINKAGE (5 COLS) */}
              <div className="lg:col-span-5 bg-white border border-[#c4d4ec] rounded-sm shadow-xs overflow-hidden">
                <div className="bg-[#f0f4f8] border-b border-[#c4d4ec] px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#104080]" />
                    <span className="font-bold text-xs text-[#104080] uppercase tracking-wide">
                      1. Master CIF Linkage
                    </span>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-[#104080] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> KYC Master
                  </span>
                </div>

                <div className="p-3.5 space-y-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-[#104080] mb-1">
                      Select Verified CIF (Retail Customer / Servicer):
                    </label>
                    <select
                      value={selectedPartyId}
                      onChange={(e) => handleSelectCif(e.target.value)}
                      disabled={loadingCifs}
                      className="w-full bg-white border border-[#c4d4ec] rounded px-2.5 py-1.5 text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#104080] cursor-pointer disabled:opacity-60"
                    >
                      <option value="">
                        {loadingCifs ? "Loading Verified CIFs..." : "-- Choose Verified CIF or Enter Profile Manually --"}
                      </option>
                      {eligibleCifs.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.cif_no} — {c.first_name} {c.last_name} {c.contact_number ? `(${c.contact_number})` : ""}
                        </option>
                      ))}
                    </select>
                    {selectedPartyId ? (
                      <div className="text-[10.5px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Linked to Retail CIF {selectedCifObj?.cif_no}. Full profile inherited.</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-gray-500 mt-1">
                        Select an onboarding CIF or type primary account holder details below.
                      </div>
                    )}
                  </div>

                  {/* KYC Verification Mini-Card */}
                  <div className="border border-dashed border-[#c4d4ec] bg-[#fbfcfd] p-2.5 rounded flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 border border-gray-300 rounded flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      {selectedCifObj?.photo_url ? (
                        <img
                          src={selectedCifObj.photo_url}
                          alt="KYC Photo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="text-[11px] leading-tight space-y-0.5">
                      <div className="font-bold text-gray-800 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {selectedPartyId ? "Verified KYC Documented" : "Direct Onboarding"}
                      </div>
                      <div className="text-gray-500 text-[10px]">
                        {selectedPartyId
                          ? `CIF Identification: ${selectedCifObj?.cif_no}`
                          : "New Standalone Account Opening"}
                      </div>
                      <div className="text-[9.5px] text-blue-900 font-semibold">
                        AML & Sanction Screening Cleared
                      </div>
                    </div>
                  </div>

                  {/* Profile Inputs */}
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                        Primary Account Holder Legal Title: *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white border border-[#c4d4ec] rounded px-2.5 py-1.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#104080]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                          Contact Phone:
                        </label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-white border border-[#c4d4ec] rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#104080]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                          Operating City / Hub:
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-white border border-[#c4d4ec] rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#104080]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                        Account Operation Mode:
                      </label>
                      <select
                        value={operatingMode}
                        onChange={(e) => setOperatingMode(e.target.value)}
                        className="w-full bg-white border border-[#c4d4ec] rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#104080] cursor-pointer"
                      >
                        <option value="Single (Self-Operated)">Single (Self-Operated)</option>
                        <option value="Joint - Either or Survivor">Joint - Either or Survivor</option>
                        <option value="Joint - Jointly by All">Joint - Jointly by All</option>
                        <option value="Authorized Signatory (Power of Attorney)">Authorized Signatory (Power of Attorney)</option>
                        <option value="Corporate Board Resolution">Corporate Board Resolution</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: SCHEME SPECIFICATIONS (7 COLS) */}
              <div className="lg:col-span-7 bg-white border border-[#c4d4ec] rounded-sm shadow-xs overflow-hidden">
                <div className="bg-[#f0f4f8] border-b border-[#c4d4ec] px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {schemeDetails[accountType].icon}
                    <span className="font-bold text-xs text-[#104080] uppercase tracking-wide">
                      2. {schemeDetails[accountType].title}
                    </span>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-[#104080] font-bold px-2 py-0.5 rounded font-mono">
                    SCHEME CODE: {schemeCode}
                  </span>
                </div>

                <div className="p-3.5 space-y-3">
                  
                  {/* SCHEME A: SAVINGS ACCOUNT (SBA) */}
                  {accountType === "SAVINGS" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-extrabold text-[#104080] mb-0.5">
                          Initial Opening Deposit ({currencySymbol}):
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-2.5 font-bold text-gray-500 text-xs">
                            {currencySymbol}
                          </span>
                          <input
                            type="number"
                            value={initialDeposit}
                            onChange={(e) => setInitialDeposit(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full bg-white border border-[#c4d4ec] rounded pl-8 pr-3 py-1.5 text-xs font-bold text-[#104080] focus:outline-none focus:border-[#104080]"
                          />
                        </div>
                        {Number(initialDeposit) > 0 && (
                          <div className="text-[10.5px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{formatAmountInWords(Number(initialDeposit), branch)}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                            Nominee Full Name (Optional):
                          </label>
                          <input
                            type="text"
                            value={nomineeName}
                            onChange={(e) => setNomineeName(e.target.value)}
                            className="w-full bg-white border border-[#c4d4ec] rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#104080]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                            Nominee Relationship:
                          </label>
                          <select
                            value={nomineeRelation}
                            onChange={(e) => setNomineeRelation(e.target.value)}
                            className="w-full bg-white border border-[#c4d4ec] rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#104080] cursor-pointer"
                          >
                            <option value="Spouse">Spouse</option>
                            <option value="Son">Son</option>
                            <option value="Daughter">Daughter</option>
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Brother">Brother</option>
                            <option value="Sister">Sister</option>
                            <option value="Other">Other Nominee</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={chequeBookRequired}
                            onChange={(e) => setChequeBookRequired(e.target.checked)}
                            className="rounded border-gray-300 text-[#104080] focus:ring-0 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-gray-700">Issue Personalized Cheque Book</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={debitCardRequired}
                            onChange={(e) => setDebitCardRequired(e.target.checked)}
                            className="rounded border-gray-300 text-[#104080] focus:ring-0 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-gray-700">Issue International Debit Card</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* SCHEME B: CURRENT COMMERCIAL ACCOUNT (CAA) */}
                  {accountType === "CURRENT" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                            Entity Constitution Type:
                          </label>
                          <select
                            value={constitutionType}
                            onChange={(e) => setConstitutionType(e.target.value)}
                            className="w-full bg-white border border-[#c4d4ec] rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#104080] cursor-pointer"
                          >
                            <option value="Sole Proprietorship">Sole Proprietorship</option>
                            <option value="Partnership Firm">Partnership Firm</option>
                            <option value="Private Limited Company">Private Limited Company</option>
                            <option value="Public Limited Company">Public Limited Company</option>
                            <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
                            <option value="Trust / Society / NGO">Trust / Society / NGO</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                            {branch === "UAE" ? "TRN / Tax Registration Number:" : "GSTIN / Commercial Tax ID:"}
                          </label>
                          <input
                            type="text"
                            value={taxId}
                            onChange={(e) => setTaxId(e.target.value.toUpperCase())}
                            className="w-full bg-white border border-[#c4d4ec] rounded px-2.5 py-1.5 text-xs font-mono font-bold uppercase text-gray-900 focus:outline-none focus:border-[#104080]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                          Registered Trade / Business Operating Title:
                        </label>
                        <input
                          type="text"
                          value={tradeName}
                          onChange={(e) => setTradeName(e.target.value)}
                          className="w-full bg-white border border-[#c4d4ec] rounded px-2.5 py-1.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#104080]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold text-[#104080] mb-0.5">
                          Initial Operating Deposit ({currencySymbol}):
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-2.5 font-bold text-gray-500 text-xs">
                            {currencySymbol}
                          </span>
                          <input
                            type="number"
                            value={initialDeposit}
                            onChange={(e) => setInitialDeposit(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full bg-white border border-[#c4d4ec] rounded pl-8 pr-3 py-1.5 text-xs font-bold text-[#104080] focus:outline-none focus:border-[#104080]"
                          />
                        </div>
                        {Number(initialDeposit) > 0 && (
                          <div className="text-[10.5px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{formatAmountInWords(Number(initialDeposit), branch)}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={odFacility}
                            onChange={(e) => setOdFacility(e.target.checked)}
                            className="rounded border-gray-300 text-[#104080] focus:ring-0 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-gray-700">
                            Enable Auto-Sweep Overdraft Linkage
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={chequeBookRequired}
                            onChange={(e) => setChequeBookRequired(e.target.checked)}
                            className="rounded border-gray-300 text-[#104080] focus:ring-0 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-gray-700">
                            Issue 100-Leaf Corporate Cheque Book
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* SCHEME C: BORROWED / OVERDRAFT ACCOUNT (ODA) */}
                  {accountType === "BORROWED" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                            Credit Facility Sub-Type:
                          </label>
                          <select
                            value={facilityType}
                            onChange={(e) => setFacilityType(e.target.value)}
                            className="w-full bg-white border border-[#c4d4ec] rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#104080] cursor-pointer"
                          >
                            <option value="Clean Overdraft Facility">Clean Overdraft Facility</option>
                            <option value="Secured Cash Credit (CC)">Secured Cash Credit (CC)</option>
                            <option value="Working Capital Demand Loan">Working Capital Demand Loan</option>
                            <option value="Revolving Short-Term Line">Revolving Short-Term Line</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-extrabold text-[#104080] mb-0.5">
                            Sanctioned Credit Limit ({currencySymbol}): *
                          </label>
                          <div className="relative flex items-center">
                            <span className="absolute left-2.5 font-bold text-gray-500 text-xs">
                              {currencySymbol}
                            </span>
                            <input
                              type="number"
                              value={sanctionedLimit}
                              onChange={(e) => setSanctionedLimit(e.target.value === "" ? "" : Number(e.target.value))}
                              className="w-full bg-white border border-[#c4d4ec] rounded pl-8 pr-3 py-1.5 text-xs font-extrabold text-[#104080] focus:outline-none focus:border-[#104080]"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {Number(sanctionedLimit) > 0 && (
                        <div className="text-[10.5px] font-bold text-purple-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-purple-600" />
                          <span>Drawing Power: {formatAmountInWords(Number(sanctionedLimit), branch)}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                            Pricing Rate (% p.a.):
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={interestRate}
                            onChange={(e) => setInterestRate(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full bg-white border border-[#c4d4ec] rounded px-2.5 py-1.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#104080]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                            Sanction Effective Date:
                          </label>
                          <FinacleDatePicker
                            value={sanctionDate}
                            onChange={(e) => setSanctionDate(e.target.value)}
                            className="w-full bg-white border border-[#c4d4ec] rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#104080]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                            Annual Review Date:
                          </label>
                          <FinacleDatePicker
                            value={reviewDate}
                            onChange={(e) => setReviewDate(e.target.value)}
                            className="w-full bg-white border border-[#c4d4ec] rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#104080]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                            Collateral / Security Reference:
                          </label>
                          <input
                            type="text"
                            value={collateralDetails}
                            onChange={(e) => setCollateralDetails(e.target.value)}
                            className="w-full bg-white border border-[#c4d4ec] rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#104080]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                            Drawing Power Margin (%):
                          </label>
                          <input
                            type="number"
                            value={dpMargin}
                            onChange={(e) => setDpMargin(Number(e.target.value))}
                            className="w-full bg-white border border-[#c4d4ec] rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#104080]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SCHEME D: SERVICER FLOAT WALLET (SRV) */}
                  {accountType === "SERVICER" && (
                    <div className="space-y-3">
                      {/* Sub-form */}
                      <div className="bg-[#fbfcfd] border border-[#c4d4ec] p-3 rounded-sm space-y-2.5">
                        <div className="text-[11px] font-extrabold text-[#104080] flex items-center justify-between">
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
                              className="text-[10.5px] text-red-600 hover:underline cursor-pointer font-bold"
                            >
                              Cancel Edit
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10.5px] font-bold text-gray-600 mb-0.5">
                              Bank Account Number: *
                            </label>
                            <input
                              type="text"
                              value={entryAccountNumber}
                              onChange={(e) => setEntryAccountNumber(e.target.value)}
                              className="w-full bg-white border border-[#c4d4ec] rounded px-2.5 py-1 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#104080]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10.5px] font-bold text-gray-600 mb-0.5">
                              IFSC Code (11 Characters): *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                maxLength={11}
                                value={entryIfsc}
                                onChange={(e) => handleIfscLookup(e.target.value)}
                                className="w-full bg-white border border-[#c4d4ec] rounded px-2.5 py-1 text-xs font-mono font-bold uppercase text-[#104080] focus:outline-none focus:border-[#104080]"
                              />
                              {lookingUpIfsc && (
                                <RefreshCw className="w-3 h-3 text-[#104080] animate-spin absolute right-2.5 top-2" />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10.5px] font-bold text-gray-600 mb-0.5">
                              Bank Name: *
                            </label>
                            <input
                              type="text"
                              value={entryBankName}
                              onChange={(e) => setEntryBankName(e.target.value)}
                              className="w-full bg-white border border-[#c4d4ec] rounded px-2.5 py-1 text-xs text-gray-900 focus:outline-none focus:border-[#104080]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10.5px] font-bold text-gray-600 mb-0.5">
                              Branch / Clearing Office:
                            </label>
                            <input
                              type="text"
                              value={entryBranchName}
                              onChange={(e) => setEntryBranchName(e.target.value)}
                              className="w-full bg-white border border-[#c4d4ec] rounded px-2.5 py-1 text-xs text-gray-900 focus:outline-none focus:border-[#104080]"
                            />
                          </div>
                        </div>

                        {entryError && (
                          <div className="text-[10px] text-amber-800 font-bold bg-amber-50 p-1.5 border border-amber-200 rounded">
                            {entryError}
                          </div>
                        )}

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={handleAddOrUpdateBankAccount}
                            className="flex items-center gap-1 bg-[#104080] hover:bg-[#1a559e] text-white px-3 py-1 rounded text-xs font-bold shadow-xs cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {editingBankIndex !== null ? "Update Bank Account" : "Add Settlement Account"}
                          </button>
                        </div>
                      </div>

                      {/* Accounts Table */}
                      <div className="border border-[#c4d4ec] rounded overflow-hidden shadow-2xs">
                        <table className="w-full border-collapse text-left">
                          <thead>
                            <tr className="bg-[#f0f4f8] border-b border-[#c4d4ec] text-[10.5px] font-bold text-[#104080]">
                              <th className="p-2 w-16 text-center">Primary</th>
                              <th className="p-2">Bank Name</th>
                              <th className="p-2">Account Number</th>
                              <th className="p-2">IFSC Code</th>
                              <th className="p-2 w-16 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e5e9f0]">
                            {bankAccounts.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-3 text-center text-gray-400 italic text-[11px]">
                                  No external settlement accounts registered yet.
                                </td>
                              </tr>
                            ) : (
                              bankAccounts.map((b, idx) => (
                                <tr key={idx} className={b.is_primary ? "bg-blue-50/40" : "hover:bg-gray-50"}>
                                  <td className="p-2 text-center">
                                    <input
                                      type="radio"
                                      name="primary_bank"
                                      checked={b.is_primary}
                                      onChange={() => handleSetPrimaryBank(idx)}
                                      className="cursor-pointer text-[#104080] focus:ring-0"
                                    />
                                  </td>
                                  <td className="p-2 font-bold text-gray-800">{b.bank_name}</td>
                                  <td className="p-2 font-mono font-bold text-[#104080]">{b.account_number}</td>
                                  <td className="p-2 font-mono text-gray-600">{b.ifsc_code}</td>
                                  <td className="p-2 text-right space-x-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleEditBank(idx)}
                                      className="text-blue-700 hover:text-blue-900 cursor-pointer"
                                    >
                                      <Pencil className="w-3 h-3 inline" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteBank(idx)}
                                      className="text-red-600 hover:text-red-800 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3 inline" />
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

            {/* SECTION 3: CORE BANKING LEDGER SPECIFICATIONS & ACCOUNT PREVIEW CARD */}
            <div className="bg-white border border-[#c4d4ec] rounded-sm shadow-xs overflow-hidden">
              <div className="bg-[#f0f4f8] border-b border-[#c4d4ec] px-3.5 py-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs text-[#104080] uppercase tracking-wide">
                    3. Core Banking General Ledger Provisioning Preview
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-bold font-mono">
                  GL SUBHEAD: {schemeCode} • BRANCH: {branch}
                </span>
              </div>

              <div className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
                {/* Account Number Box */}
                <div className="md:col-span-6 bg-gradient-to-r from-[#104080] to-[#1a559e] text-white p-3 rounded-sm shadow-xs">
                  <span className="text-[10px] text-blue-200 block uppercase font-bold tracking-wider">
                    Auto-Generated Finacle Account Number:
                  </span>
                  <div className="font-mono text-lg font-extrabold tracking-widest text-amber-300 mt-0.5">
                    {accountPattern}
                  </div>
                  <div className="text-[10.5px] text-blue-100 mt-1 flex items-center justify-between">
                    <span>Scheme: {schemeDetails[accountType].label}</span>
                    <span className="font-mono font-bold">IFSC: {clearingIfsc}</span>
                  </div>
                </div>

                {/* Scheme Description & Status */}
                <div className="md:col-span-6 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">Target Scheme:</span>
                    <span className="bg-blue-100 text-[#104080] px-2 py-0.5 rounded font-extrabold text-[11px]">
                      {schemeDetails[accountType].title}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-normal italic bg-blue-50/60 p-2 border-l-2 border-[#104080] rounded-r">
                    {schemeDetails[accountType].desc}
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 4: STICKY BANKING COMMAND BAR (FOOTER) */}
            <div className="bg-white border border-[#c4d4ec] rounded-sm p-3 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="font-bold text-gray-800">Branch Office:</span>
                <span className="font-mono font-bold text-[#104080] flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-[#104080]" />
                  <span>{branch === "UAE" ? "Dubai Regional Branch (UAE)" : "India National Branch (IN)"}</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="font-bold text-gray-800">Currency:</span>
                <span className="font-bold text-emerald-800">{currencySymbol}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-3.5 py-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  Clear Form
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2 rounded text-xs font-extrabold shadow-md cursor-pointer disabled:opacity-50 transition-all"
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
    </div>
  );
}
