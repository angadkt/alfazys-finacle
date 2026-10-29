import React, { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import FinacleDatePicker from "./FinacleDatePicker";
import FinacleSelect from "./FinacleSelect";
import Loader from "./Loader";
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
  ArrowLeft,
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

export interface JointHolder {
  partyId?: string;
  cifNo?: string;
  name: string;
  designation?: string;
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
  cif_type_name?: string;
  cif_type_id?: number | string;
}

interface OpenAccountScreenProps {
  onNavigate?: (screen: string, accountNo?: string) => void;
}

export default function OpenAccountScreen({ onNavigate }: OpenAccountScreenProps) {
  // Value / Account Opening Date (First Parameter)
  const [openingDate, setOpeningDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Scheme Selection
  const [accountType, setAccountType] = useState<AccountType>("SAVINGS");

  // Multi-Step Wizard Flow (1: Scheme & Date, 2: Branch & CIF, 3: Scheme Details & Activation)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [stepLoading, setStepLoading] = useState(false);

  // CIF Selection (Servicer-only vs All CIFs)
  const [servicerCifs, setServicerCifs] = useState<EligibleCif[]>([]);
  const [allCifs, setAllCifs] = useState<EligibleCif[]>([]);
  const [loadingCifs, setLoadingCifs] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState<string>("");

  // Context-aware dynamic CIF list: Servicer scheme shows only servicers; all other schemes show all verified CIFs
  const activeCifList: EligibleCif[] = useMemo(() => {
    if (accountType === "SERVICER") {
      return servicerCifs;
    }
    return allCifs.length > 0 ? allCifs : servicerCifs;
  }, [accountType, servicerCifs, allCifs]);

  // Base Identity Fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [branch, setBranch] = useState<"INDIA" | "UAE">("INDIA");

  // Scheme Financial Parameters
  const [initialDeposit, setInitialDeposit] = useState<number | "">("");
  const [sanctionedLimit, setSanctionedLimit] = useState<number | "">("");
  const [jointHolders, setJointHolders] = useState<JointHolder[]>([
    { partyId: "", cifNo: "", name: "", designation: "Co-Signatory / Partner" }
  ]);

  const handleAddJointHolder = () => {
    setJointHolders((prev) => [
      ...prev,
      { partyId: "", cifNo: "", name: "", designation: "Co-Signatory / Partner" }
    ]);
  };

  const handleRemoveJointHolder = (index: number) => {
    setJointHolders((prev) =>
      prev.length > 1
        ? prev.filter((_, i) => i !== index)
        : [{ partyId: "", cifNo: "", name: "", designation: "Co-Signatory / Partner" }]
    );
  };

  const handleUpdateJointHolder = (index: number, field: keyof JointHolder, val: string) => {
    setJointHolders((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleSelectJointCif = (index: number, partyId: string) => {
    setJointHolders((prev) => {
      const updated = [...prev];
      if (!partyId) {
        updated[index] = {
          ...updated[index],
          partyId: "",
          cifNo: "",
          name: ""
        };
        return updated;
      }
      const cif =
        allCifs.find((c) => String(c.id) === String(partyId)) ||
        servicerCifs.find((c) => String(c.id) === String(partyId));
      if (cif) {
        const fullName = `${cif.first_name} ${cif.last_name}`.trim();
        updated[index] = {
          ...updated[index],
          partyId: String(cif.id),
          cifNo: cif.cif_no,
          name: fullName
        };
      }
      return updated;
    });
  };

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

  const fetchAllCifsData = async () => {
    try {
      setLoadingCifs(true);
      const [servicerRes, partiesRes, mastersRes] = await Promise.allSettled([
        api.get("/payouts/eligible-cifs"),
        api.get("/records/parties"),
        api.get("/masters/cif_types")
      ]);

      const cifTypeLookup: Record<string, string> = {
        "1": "Agent",
        "2": "Customer",
        "3": "Employee",
        "4": "Other",
        "5": "Servicer",
        "6": "Payment Distributor",
        "7": "Supplier"
      };

      if (mastersRes.status === "fulfilled" && Array.isArray(mastersRes.value.data)) {
        mastersRes.value.data.forEach((m: any) => {
          if (m?.id && m?.name) {
            cifTypeLookup[String(m.id)] = m.name.charAt(0).toUpperCase() + m.name.slice(1).toLowerCase();
          }
        });
      }

      // 1. Process Servicer CIFs (Filtered strictly for float wallets)
      if (servicerRes.status === "fulfilled") {
        const rawServicers = Array.isArray(servicerRes.value.data)
          ? servicerRes.value.data
          : servicerRes.value.data?.cifs || [];
        const formattedServicers: EligibleCif[] = rawServicers.map((s: any) => ({
          ...s,
          cif_type_name: "Servicer"
        }));
        setServicerCifs(formattedServicers);
      }

      // 2. Process All Verified Parties (For Savings, Salary, Corporate, Profit, Expense, Overdraft)
      if (partiesRes.status === "fulfilled") {
        const rawParties = partiesRes.value.data?.records || [];
        const verifiedParties = rawParties.filter((p: any) => p.status === "verified");
        const formattedAll: EligibleCif[] = verifiedParties.map((p: any) => {
          const permAddr = p.addresses?.find((a: any) => a.address_type === "PERMANENT") || p.addresses?.[0];
          const rawTypeId = String(p.cif_type_id || "");
          const typeName = cifTypeLookup[rawTypeId] || p.cif_type_name || "Customer";
          return {
            id: p.id,
            cif_no: p.cif_no || String(p.id),
            first_name: p.first_name || "",
            last_name: p.last_name || "",
            contact_number: p.contact_number,
            indian_number: p.indian_number,
            city: permAddr?.city || p.city || "",
            country: permAddr?.country || p.country || "",
            branch_id: p.branch_id,
            cif_type_name: typeName,
            cif_type_id: p.cif_type_id
          };
        });
        setAllCifs(formattedAll);
      }
    } catch (err) {
      console.error("Error loading CIF lists:", err);
    } finally {
      setLoadingCifs(false);
    }
  };

  useEffect(() => {
    fetchAllCifsData();
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
    const cif =
      activeCifList.find((c) => String(c.id) === String(partyId)) ||
      allCifs.find((c) => String(c.id) === String(partyId)) ||
      servicerCifs.find((c) => String(c.id) === String(partyId));
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
    setStepLoading(false);
    setCurrentStep(1);
    setOpeningDate(new Date().toISOString().slice(0, 10));
    setSelectedPartyId("");
    setName("");
    setPhone("");
    setCity("");
    setBranch("INDIA");
    setInitialDeposit("");
    setSanctionedLimit("");
    setJointHolders([{ partyId: "", cifNo: "", name: "", designation: "Co-Signatory / Partner" }]);
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

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openingDate) {
      setFormError("Account Opening Value Date is required.");
      return;
    }
    if (!accountType) {
      setFormError("Please select an Account Scheme.");
      return;
    }
    setFormError("");
    setStepLoading(true);
    setTimeout(() => {
      setStepLoading(false);
      setCurrentStep(2);
    }, 600);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountType === "SERVICER" && !selectedPartyId && !name.trim()) {
      setFormError("Please select an approved Servicer CIF or enter the legal servicer name.");
      return;
    }
    if (!name.trim()) {
      setFormError("Primary Account Holder Name / Legal Title is required.");
      return;
    }
    setFormError("");
    setStepLoading(true);
    setTimeout(() => {
      setStepLoading(false);
      setCurrentStep(3);
    }, 600);
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

    if (accountType === "CORPORATE_JOINT") {
      const validJoints = jointHolders.filter((j) => j.name.trim());
      if (validJoints.length === 0) {
        setFormError("At least one Secondary Joint Signatory / Co-Applicant Legal Title is required.");
        return;
      }
    }

    setSubmitting(true);
    setFormError("");

    // Automatically incorporate any pending typed bank account in case user didn't press "Add"
    const pendingBank = (accountType === "SERVICER" && entryAccountNumber.trim() && entryIfsc.trim() && entryBankName.trim()) ? [{
      account_holder: entryAccountHolder.trim() || name.trim(),
      bank_name: entryBankName.trim(),
      account_number: entryAccountNumber.trim(),
      ifsc_code: entryIfsc.trim().toUpperCase(),
      branch_name: entryBranchName.trim(),
      account_type: entryAccountType,
      is_primary: bankAccounts.length === 0
    }] : [];

    const validBankAccounts = [...bankAccounts, ...pendingBank].filter(
      (b) => b.account_number.trim() && b.bank_name.trim() && b.ifsc_code.trim()
    );

    const primaryName = name.trim();
    const validJointNames = jointHolders.map((j) => j.name.trim()).filter(Boolean);
    const finalLegalTitle =
      accountType === "CORPORATE_JOINT" && validJointNames.length > 0
        ? `${primaryName} & ${validJointNames.join(" & ")}`
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
      fetchAllCifsData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || "Failed to provision account");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCifObj =
    activeCifList.find((c) => String(c.id) === String(selectedPartyId)) ||
    allCifs.find((c) => String(c.id) === String(selectedPartyId)) ||
    servicerCifs.find((c) => String(c.id) === String(selectedPartyId));

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden text-xs select-none">
      {/* 1. Page Title Header */}
      <div className="bg-white px-5 md:px-8 py-3.5 border-b border-gray-200 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Landmark className="w-5 h-5 text-[#104080]" />
          <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
            Open Account Onboarding Desk (OAAC)
          </h1>
        </div>
      </div>

      {/* 2. Main Workspace Area - Centered Stepped Flow */}
      <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar bg-slate-50/60">
        <div className="min-h-full flex flex-col items-center justify-center pt-4 pb-20 md:pb-28">
          <div className={`w-full mx-auto space-y-6 -translate-y-4 md:-translate-y-6 ${currentStep === 3 ? 'max-w-3xl' : 'max-w-2xl'}`}>

            {/* Error Banner */}
            {formError && (
              <div className="bg-red-50 border-l-4 border-red-600 p-3.5 rounded-md flex items-center gap-2.5 text-red-800 text-xs shadow-xs">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-bold">{formError}</span>
              </div>
            )}

            {/* Step Transition Loading State */}
            {stepLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader />
              </div>
            ) : (
              <>
                {/* STEP 1: ACCOUNT CLASSIFICATION & VALUE DATE ONLY */}
                {currentStep === 1 && (
                  <form onSubmit={handleStep1Submit} className="bg-white border border-gray-200 rounded-lg shadow-xs">
              <div className="bg-[#104080] text-white px-5 py-3.5 flex items-center justify-between rounded-t-lg shadow-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-200" />
                  <span className="font-bold text-sm text-white uppercase tracking-wide">
                    Account Classification &amp; Value Date
                  </span>
                </div>
                <span className="text-[11px] bg-white/15 text-white border border-white/25 font-bold px-2 py-0.5 rounded font-mono">
                  1/3
                </span>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                        const newType = e.target.value as AccountType;
                        setAccountType(newType);
                        setFormError("");
                        if (newType === "SERVICER" && selectedPartyId) {
                          const isServicer = servicerCifs.some(
                            (s) => String(s.id) === String(selectedPartyId)
                          );
                          if (!isServicer) {
                            setSelectedPartyId("");
                            setName("");
                            setPhone("");
                            setCity("");
                            setEntryAccountHolder("");
                          }
                        }
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
                </div>
              </div>

              {/* Step 1 Actions */}
              <div className="bg-slate-50 border-t border-gray-200 px-6 py-3.5 flex items-center justify-between rounded-b-lg">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-md text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  Clear Form
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#104080] hover:bg-[#1a559e] text-white px-5 py-2 rounded-md text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  <span>Continue to CIF &amp; Branch Linkage</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: OPERATING BRANCH, CLEARING IFSC & MASTER CIF LINKAGE */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="bg-white border border-gray-200 rounded-lg shadow-xs">
              <div className="bg-[#104080] text-white px-5 py-3.5 flex items-center justify-between rounded-t-lg shadow-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-200" />
                  <span className="font-bold text-sm text-white uppercase tracking-wide">
                    Operating Branch &amp; Master CIF Linkage
                  </span>
                </div>
                <span className="text-[11px] bg-white/15 text-white border border-white/25 font-bold px-2 py-0.5 rounded font-mono">
                  2/3
                </span>
              </div>

              <div className="p-6 space-y-6">
                {/* 1. Operating Branch & Clearing IFSC Section */}
                <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 space-y-3">
                  <div className="text-[12px] font-bold text-[#104080] uppercase tracking-wide flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#104080]" />
                    <span>Operating Branch &amp; Clearing Parameters</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                        Clearing IFSC Code:
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={clearingIfsc}
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-mono font-bold text-[#104080] focus:outline-none cursor-default h-[38px] box-border leading-normal"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Master CIF Linkage */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#104080] uppercase tracking-wide">
                      {accountType === "SERVICER"
                        ? "Select Verified Servicer CIF: *"
                        : "Select Verified Master CIF:"}
                    </label>
                    <span className="text-xs bg-blue-50 text-[#104080] border border-blue-100 font-bold px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      {accountType === "SERVICER" ? "SERVICER MASTER" : "ALL CIF MASTER"}
                    </span>
                  </div>

                  <FinacleSelect
                    value={selectedPartyId}
                    onChange={(e) => handleSelectCif(e.target.value)}
                    disabled={loadingCifs}
                    searchable={true}
                    searchPlaceholder="Type CIF #, customer name, contact..."
                    placeholder={
                      loadingCifs
                        ? "Loading Verified CIFs..."
                        : accountType === "SERVICER"
                        ? "-- Choose Verified Servicer CIF --"
                        : "-- Choose Verified CIF or Enter Manually Below --"
                    }
                    options={[
                      {
                        value: "",
                        label:
                          accountType === "SERVICER"
                            ? "-- Choose Verified Servicer CIF --"
                            : "-- Choose Verified CIF or Enter Manually Below --"
                      },
                      ...activeCifList.map((c) => {
                        const fullName = `${c.first_name} ${c.last_name}`.trim();
                        const badge = c.cif_type_name || (accountType === "SERVICER" ? "Servicer" : "CIF");
                        return {
                          value: String(c.id),
                          label: `${c.cif_no} — ${fullName} [${badge}]`,
                          subLabel: c.contact_number ? `Contact: ${c.contact_number}` : undefined
                        };
                      })
                    ]}
                  />

                  {selectedPartyId && (
                    <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 p-2.5 rounded-md">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Linked to {selectedCifObj?.cif_type_name || "CIF"} {selectedCifObj?.cif_no}. Full profile details inherited below.
                      </span>
                    </div>
                  )}

                  {/* Profile Details (Name & Phone) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                        Primary Account Holder Legal Title: *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
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
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#104080] focus:ring-1 focus:ring-[#104080]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 Actions */}
              <div className="bg-slate-50 border-t border-gray-200 px-6 py-3.5 flex items-center justify-between rounded-b-lg">
                <button
                  type="button"
                  onClick={() => {
                    setFormError("");
                    setCurrentStep(1);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-md text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Step 1</span>
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#104080] hover:bg-[#1a559e] text-white px-5 py-2 rounded-md text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  <span>Continue to Scheme Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SCHEME SPECIFICATIONS & FINAL AUTHORIZATION */}
          {currentStep === 3 && (
            <form onSubmit={handleOpenAccount} className="bg-white border border-gray-200 rounded-lg shadow-xs">
              <div className="bg-[#104080] text-white px-5 py-3.5 flex items-center justify-between rounded-t-lg shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-blue-200">{schemeDetails[accountType].icon}</span>
                  <span className="font-bold text-sm text-white uppercase tracking-wide">
                    {schemeDetails[accountType].title} Specifications
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-white/15 text-white border border-white/25 font-bold px-2 py-0.5 rounded font-mono">
                    3/3
                  </span>
                  <span className="text-xs font-mono font-bold bg-white/15 text-white border border-white/25 px-2.5 py-0.5 rounded">
                    {schemeCode}
                  </span>
                </div>
              </div>

              {/* Step 3 Summary Ribbon */}
              <div className="bg-slate-50/60 border-b border-gray-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-gray-500">Value Date: <strong className="text-gray-800 font-mono">{formatDateToDisplay(openingDate)}</strong></span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500">Branch: <strong className="text-gray-800">{branch === "UAE" ? "Dubai (AED)" : "India (INR)"}</strong></span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500">Holder: <strong className="text-[#104080]">{name}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-[#104080] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Edit CIF / Branch</span>
                  <Pencil className="w-3 h-3" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                  
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

                      {/* Authorized Joint Holders / Signatories Dynamic List */}
                      <div className="space-y-3 pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <label className="block text-[13px] font-bold text-[#104080] flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-[#104080]" />
                            <span>Authorized Joint Signatories / Co-Applicants: *</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleAddJointHolder}
                            className="flex items-center gap-1 text-[11px] font-bold text-[#104080] hover:text-[#0b2b57] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded cursor-pointer transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Add Joint Signatory</span>
                          </button>
                        </div>

                        <div className="space-y-3">
                          {jointHolders.map((holder, idx) => (
                            <div
                              key={idx}
                              className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2.5 transition-all"
                            >
                              <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-4 h-4 rounded-full bg-[#104080] text-white flex items-center justify-center text-[10px] font-mono">
                                    {idx + 1}
                                  </span>
                                  <span>Joint Signatory #{idx + 1}</span>
                                </span>
                                {jointHolders.length > 1 ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveJointHolder(idx)}
                                    className="text-gray-400 hover:text-red-600 p-0.5 rounded hover:bg-red-50 cursor-pointer flex items-center gap-1 text-[10px]"
                                    title="Remove Signatory"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                    <span>Remove</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    Primary Co-Signatory
                                  </span>
                                )}
                              </div>

                              {/* Choose CIF for this joint signatory */}
                              <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                  Select Verified CIF for Signatory #{idx + 1}: *
                                </label>
                                <FinacleSelect
                                  value={holder.partyId || ""}
                                  onChange={(e) => handleSelectJointCif(idx, e.target.value)}
                                  disabled={loadingCifs}
                                  searchable={true}
                                  searchPlaceholder="Type CIF #, signatory name, contact..."
                                  placeholder={loadingCifs ? "Loading Verified CIFs..." : "-- Select Verified CIF --"}
                                  options={[
                                    { value: "", label: "-- Select Verified CIF or Enter Below --" },
                                    ...allCifs.map((c) => {
                                      const fullName = `${c.first_name} ${c.last_name}`.trim();
                                      const badge = c.cif_type_name || "CIF";
                                      return {
                                        value: String(c.id),
                                        label: `${c.cif_no} — ${fullName} [${badge}]`,
                                        subLabel: c.contact_number ? `Contact: ${c.contact_number}` : undefined
                                      };
                                    })
                                  ]}
                                />
                                {holder.cifNo && (
                                  <div className="text-[10.5px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>Linked to CIF {holder.cifNo}. Profile details inherited.</span>
                                  </div>
                                )}
                              </div>

                              {/* Legal Name & Designation */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                                <div>
                                  <label className="block text-[10.5px] font-semibold text-gray-600 mb-0.5">
                                    Legal Name / Co-Applicant Title: *
                                  </label>
                                  <input
                                    type="text"
                                    value={holder.name}
                                    onChange={(e) => handleUpdateJointHolder(idx, "name", e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#104080] focus:ring-1 focus:ring-[#104080]"
                                    required={idx === 0}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10.5px] font-semibold text-gray-600 mb-0.5">
                                    Designation / Role:
                                  </label>
                                  <input
                                    type="text"
                                    value={holder.designation || ""}
                                    onChange={(e) => handleUpdateJointHolder(idx, "designation", e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-[#104080] focus:ring-1 focus:ring-[#104080]"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Joint Registration Preview */}
                        <div className="text-xs bg-[#f8fafc] border border-slate-200 rounded p-2.5 space-y-0.5">
                          <span className="font-semibold text-gray-600 block">Account will be registered jointly as:</span>
                          <div className="font-bold text-[#104080] text-sm break-words">
                            {name.trim() || "[Primary Name]"}
                            {jointHolders
                              .map((j) => j.name.trim())
                              .filter(Boolean)
                              .map((jName, i) => (
                                <span key={i}> &amp; {jName}</span>
                              ))}
                            {jointHolders.filter((j) => j.name.trim()).length === 0 && (
                              <span className="text-gray-400 font-normal"> &amp; [Secondary Signatories]</span>
                            )}
                          </div>
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

              {/* Step 3 Banking Command Bar (Footer) */}
              <div className="bg-slate-50 border-t border-gray-200 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-lg">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setFormError("");
                      setCurrentStep(2);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-md text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Step 2</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-md text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    Clear Form
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2 rounded-md text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 transition-all w-full sm:w-auto justify-center"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Provisioning in Core Ledger...</span>
                    </>
                  ) : (
                    <>
                      <span>Activate &amp; Open Account</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
              </>
            )}
          </div>
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
            <div className="bg-white border-t border-gray-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {onNavigate && createdResult.account_no && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuccessModal(false);
                      onNavigate("ACCOUNT LEDGER (ACLI)", createdResult.account_no);
                    }}
                    className="inline-flex items-center gap-1.5 bg-[#104080] hover:bg-[#1a559e] text-white px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                    title="View Account Ledger Statement"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-300" />
                    <span>View Ledger (ACLI)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {createdResult.servicer_code && onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuccessModal(false);
                      onNavigate("SERVICER WALLETS");
                    }}
                    className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors shadow-2xs"
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
                  className="px-3.5 py-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded text-xs font-bold cursor-pointer transition-colors"
                >
                  Open Another Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold cursor-pointer transition-colors shadow-2xs"
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
