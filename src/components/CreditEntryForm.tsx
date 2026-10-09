import { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import api from '../services/api';
import type { CreditEntry, UtrItem } from '../services/db';

// Helper to convert number to Indian words
function numberToIndianWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return '';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertLessThanOneThousand(n: number): string {
    let s = '';
    if (n >= 100) {
      s += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      s += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      s += a[n] + ' ';
    }
    return s.trim();
  }

  let crore = Math.floor(num / 10000000);
  num %= 10000000;
  let lakh = Math.floor(num / 100000);
  num %= 100000;
  let thousand = Math.floor(num / 1000);
  num %= 1000;
  let remainder = Math.floor(num);

  let result = '';
  if (crore > 0) result += convertLessThanOneThousand(crore) + ' Crore ';
  if (lakh > 0) result += convertLessThanOneThousand(lakh) + ' Lakh ';
  if (thousand > 0) result += convertLessThanOneThousand(thousand) + ' Thousand ';
  if (remainder > 0) result += convertLessThanOneThousand(remainder) + ' ';

  return `Rupees ${result.trim()} Only`;
}

export default function CreditEntryForm() {
  // Navigation / Tab state
  const [activeMainTab, setActiveMainTab] = useState<'stepper' | 'inquiry' | 'reports'>('stepper');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedFunction, setSelectedFunction] = useState<string>('A-ADD');


  // Form State
  const [formData, setFormData] = useState({
    beneficiaryName: '',
    transactionDate: new Date().toISOString().split('T')[0],
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    phone: '',
    email: '',
    paymentDate: new Date().toISOString().split('T')[0],
    totalAmount: '',
    paymentMode: 'Bank Transfer' as CreditEntry['paymentMode'],
    companyBankAccount: '',
    purpose: '',
    remarks: ''
  });

  // UTR Items (Split settlement matching user requirement)
  const [utrItems, setUtrItems] = useState<UtrItem[]>([]);

  // Entries list & filters
  const [entries, setEntries] = useState<CreditEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modals & UI status
  const [submittedEntry, setSubmittedEntry] = useState<CreditEntry | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<CreditEntry | null>(null);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = () => {
    const data = dbService.getCreditEntries();
    setEntries(data);
  };

  // UTR calculations
  const totalEnteredAmount = parseFloat(formData.totalAmount) || 0;
  const totalUtrAllocated = utrItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const remainingUtrBalance = totalEnteredAmount - totalUtrAllocated;

  // Step Validation
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.beneficiaryName.trim()) errors.beneficiaryName = 'Beneficiary Name is required';
      if (!formData.accountNumber.trim()) errors.accountNumber = 'Account Number is required';

      if (!formData.ifscCode.trim()) errors.ifscCode = 'IFSC Code is required';
      if (!formData.bankName.trim()) errors.bankName = 'Bank Name is required';

      if (!totalEnteredAmount || totalEnteredAmount <= 0) errors.totalAmount = 'Valid total amount is required';
      if (!formData.paymentDate) errors.paymentDate = 'Payment Date is required';
    }

    if (step === 2) {
      if (utrItems.length === 0) {
        errors.utr = 'At least one UTR record is required';
      }
      for (let i = 0; i < utrItems.length; i++) {
        if (!utrItems[i].utrNumber.trim()) {
          errors.utr = `UTR Number missing at row ${i + 1}`;
          break;
        }
        if (!utrItems[i].amount || utrItems[i].amount <= 0) {
          errors.utr = `Valid Amount missing at row ${i + 1}`;
          break;
        }
      }
      if (Math.abs(remainingUtrBalance) > 0.01) {
        errors.utrBalance = `Allocated UTR sum (₹${totalUtrAllocated.toLocaleString()}) does not match Total Amount (₹${totalEnteredAmount.toLocaleString()})`;
      }
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setStepErrors({});
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePrevStep = () => {
    setStepErrors({});
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // UTR table helpers
  const handleAddUtrRow = () => {
    const nextAmount = remainingUtrBalance > 0 ? remainingUtrBalance : 0;
    const newRow: UtrItem = {
      id: `utr-${Date.now()}`,
      amount: nextAmount,
      utrNumber: '',
      status: 'Completed',
      timestamp: new Date().toLocaleString()
    };
    setUtrItems([...utrItems, newRow]);
  };

  const handleRemoveUtrRow = (index: number) => {
    const updated = [...utrItems];
    updated.splice(index, 1);
    setUtrItems(updated);
  };

  const handleUtrChange = (index: number, field: keyof UtrItem, value: any) => {
    const updated = [...utrItems];
    updated[index] = { ...updated[index], [field]: value };
    setUtrItems(updated);
  };

  const handleLoadUserSample = () => {
    setFormData({
      beneficiaryName: 'IBRAHIM KALEEL N A',
      transactionDate: new Date().toISOString().split('T')[0],
      accountNumber: '40617101127003',
      ifscCode: 'KLGB0040617',
      bankName: 'KERALA GRAMIN BANK',
      branchName: 'KASARAGOD MAIN BRANCH',
      phone: '9847000000',
      email: 'ibrahim.kaleel@example.com',
      paymentDate: new Date().toISOString().split('T')[0],
      totalAmount: '44000',
      paymentMode: 'Bank Transfer',
      companyBankAccount: 'KERALA GRAMIN BANK - TREASURY 4061001928',
      purpose: 'Vendor Payout / Client Credit Settlement',
      remarks: 'Settled via 2 UTR tranches (Completed)'
    });
    setUtrItems([
      {
        id: `utr-${Date.now()}-1`,
        amount: 24000,
        utrNumber: '005624886268',
        status: 'Completed',
        timestamp: '2026-10-07 10:14'
      },
      {
        id: `utr-${Date.now()}-2`,
        amount: 20000,
        utrNumber: '293973571072',
        status: 'Completed',
        timestamp: '2026-10-07 10:28'
      }
    ]);
    setStepErrors({});
  };

  const handleClearForm = () => {
    setFormData({
      beneficiaryName: '',
      transactionDate: new Date().toISOString().split('T')[0],
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: '',
      phone: '',
      email: '',
      paymentDate: new Date().toISOString().split('T')[0],
      totalAmount: '',
      paymentMode: 'Bank Transfer',
      companyBankAccount: 'KERALA GRAMIN BANK - TREASURY 4061001928',
      purpose: '',
      remarks: ''
    });
    setUtrItems([
      {
        id: `utr-${Date.now()}`,
        amount: 0,
        utrNumber: '',
        status: 'Completed',
        timestamp: new Date().toLocaleString()
      }
    ]);
    setCurrentStep(1);
    setStepErrors({});
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      alert('Please correct validation errors across steps before submitting.');
      return;
    }

    const apiPayload = {
      party_id: formData.beneficiaryName.trim(), // mapping beneficiary to party_id
      entry_date: formData.paymentDate,
      aed_amount: totalEnteredAmount,
      mode: formData.paymentMode,
      account_id: formData.accountNumber.trim(),
      customer_rate: 1, // Defaulting to 1 as it's required but not in UI
      utr_number: utrItems.length > 0 ? utrItems[0].utrNumber : "",
      note: formData.remarks || 'Completed'
    };

    try {
      await api.post('/records/credit', apiPayload);
      
      // Also save to local dbService to keep the UI tabs working since there's no GET endpoint yet
      const entryData = {
        paymentDate: formData.paymentDate,
        beneficiaryName: formData.beneficiaryName.trim(),
        transactionDate: formData.transactionDate,
        accountNumber: formData.accountNumber.trim(),
        ifscCode: formData.ifscCode.trim().toUpperCase(),
        bankName: formData.bankName.trim(),
        totalAmount: totalEnteredAmount,
        utrItems: [...utrItems],
        paymentMode: formData.paymentMode,
        companyBankAccount: formData.companyBankAccount,
        purpose: formData.purpose,
        remarks: formData.remarks || 'Completed',
        status: 'Completed' as const,
        createdBy: dbService.getUserRole()?.toUpperCase() || 'USER'
      };
      
      let savedEntry;
      if (editingId) {
        savedEntry = dbService.updateCreditEntry(editingId, entryData);
        setEditingId(null);
      } else {
        savedEntry = dbService.addCreditEntry(entryData);
      }

      loadEntries();
      setSubmittedEntry(savedEntry);
      
    } catch (err: any) {
      alert('Error saving credit entry to server: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCancelEntry = (id: string) => {
    if (window.confirm(`Are you sure you want to Cancel/Void Credit Entry ${id}? (Per SRS 13.4, audit history will be preserved)`)) {
      dbService.cancelCreditEntry(id);
      loadEntries();
    }
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm(`Are you sure you want to permanently delete Credit Entry ${id}?`)) {
      dbService.deleteCreditEntry(id);
      loadEntries();
    }
  };

  const handleEditEntry = (entry: any) => {
    setFormData(prev => ({
      ...prev,
      beneficiaryName: entry.beneficiaryName,
      accountNumber: entry.accountNumber,
      ifscCode: entry.ifscCode,
      bankName: entry.bankName,
      totalAmount: entry.totalAmount.toString(),
      paymentMode: entry.paymentMode,
      companyBankAccount: entry.companyBankAccount,
      purpose: entry.purpose,
      remarks: entry.remarks,
      paymentDate: entry.paymentDate,
      transactionDate: entry.transactionDate || prev.transactionDate
    }));
    setUtrItems(entry.utrItems);
    setActiveMainTab('stepper');
    setCurrentStep(1);
    setEditingId(entry.id);
  };

  const handleExportCsv = () => {
    const headers = ['Entry Number,Payment Date,Beneficiary Name,Account Number,IFSC,Bank Name,Total Amount,Payment Mode,Bank Account,UTR Numbers,Status'];
    const rows = entries.map(e => [
      e.id,
      e.paymentDate,
      `"${e.beneficiaryName}"`,
      `"${e.accountNumber}"`,
      e.ifscCode,
      `"${e.bankName}"`,
      e.totalAmount,
      e.paymentMode,
      `"${e.companyBankAccount}"`,
      `"${e.utrItems.map(u => `${u.utrNumber}(₹${u.amount})`).join('; ')}"`,
      e.status
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Finacle_Credit_Entries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering
  const filteredEntries = entries.filter(item => {
    const matchesQuery = !searchQuery || 
      item.beneficiaryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.accountNumber.includes(searchQuery) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.utrItems.some(u => u.utrNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesMode = filterMode === 'ALL' || item.paymentMode === filterMode;
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
    return matchesQuery && matchesMode && matchesStatus;
  });

  const stepsList = [
    { num: 1, label: '1. Beneficiary & Bank Info' },
    { num: 2, label: '2. UTR Split Settlement' },
    { num: 3, label: '3. Verification & Ledger Post' }
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#e4e4e4] overflow-hidden" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      
      {/* 1. Header Bar */}
      <div className="bg-white px-3 py-2 border-b border-[#a0a0a0] flex items-center justify-between">
        <div>
          <h4 className="text-[15px] font-extrabold text-[#1e4676] m-0 capitalize tracking-wide">
            Credit Entry Management
          </h4>
          <span className="text-[11px] text-gray-600">
            FINCORE Universal Settlement Module • SRS v1.5 Sec 13 Outgoing Payment Gateway
          </span>
        </div>

        {/* Function selection & shortcuts */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-bold text-[#1e4676]">Function:</span>
          <select 
            value={selectedFunction} 
            onChange={(e) => {
              setSelectedFunction(e.target.value);
              if (e.target.value === 'I-INQUIRE') {
                setActiveMainTab('inquiry');
              } else if (e.target.value === 'A-ADD') {
                setActiveMainTab('stepper');
              }
            }}
            className="border border-[#7f9db9] bg-white text-black px-1 h-[22px] text-[11px]"
          >
            <option value="A-ADD">A-ADD (New Credit Entry)</option>
            <option value="I-INQUIRE">I-INQUIRE (View & Search List)</option>
            <option value="M-MODIFY">M-MODIFY (Edit Draft)</option>
            <option value="X-CANCEL">X-CANCEL / VOID (Audit Log)</option>
          </select>

          <button 
            onClick={handleLoadUserSample}
            title="Auto-fill sample data from client requirement (IBRAHIM KALEEL N A)"
            className="bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-2 py-0.5 text-[11px] text-[#000080] font-bold"
          >
            ⚡ Load Client Sample
          </button>
        </div>
      </div>


      {/* 2. Main Navigation Tabs (Classic Finacle 2004 Tabs) */}
      <div className="flex border-b border-[#a0a0a0] bg-[#e4e4e4] px-2 pt-1 gap-1 m-1">
        <button
          onClick={() => { setActiveMainTab('stepper'); setIsModalOpen(true); }}
          className={`px-4 py-1.5 text-[11px] font-bold border border-b-0 border-[#a0a0a0] rounded-t-sm select-none transition-none ${
            activeMainTab === 'stepper' 
              ? 'bg-white text-[#104080] shadow-[inset_0_2px_0_#104080]' 
              : 'bg-[#d4d0c8] text-black hover:bg-[#eaeaea]'
          }`}
          style={{ marginBottom: '-1px' }}
        >
          [ STEP-BY-STEP CREDIT ENTRY WIZARD ]
        </button>
        <button
          onClick={() => {
            setActiveMainTab('inquiry'); setIsModalOpen(true);
            loadEntries();
          }}
          className={`px-4 py-1.5 text-[11px] font-bold border border-b-0 border-[#a0a0a0] rounded-t-sm select-none transition-none ${
            activeMainTab === 'inquiry' 
              ? 'bg-white text-[#104080] shadow-[inset_0_2px_0_#104080]' 
              : 'bg-[#d4d0c8] text-black hover:bg-[#eaeaea]'
          }`}
          style={{ marginBottom: '-1px' }}
        >
          [ VIEW & INQUIRE ALL ENTRIES ({entries.length}) ]
        </button>
        <button
          onClick={() => {
            setActiveMainTab('reports'); setIsModalOpen(true);
            loadEntries();
          }}
          className={`px-4 py-1.5 text-[11px] font-bold border border-b-0 border-[#a0a0a0] rounded-t-sm select-none transition-none ${
            activeMainTab === 'reports' 
              ? 'bg-white text-[#104080] shadow-[inset_0_2px_0_#104080]' 
              : 'bg-[#d4d0c8] text-black hover:bg-[#eaeaea]'
          }`}
          style={{ marginBottom: '-1px' }}
        >
          [ CREDIT ENTRY REPORTS & AUDIT (SRS 13.5) ]
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-[#e4e4e4] shadow-2xl flex flex-col h-[95vh] w-[95vw] max-w-[1400px] border-2 border-[#104080] rounded-[2px] overflow-hidden">
            
            {/* Window Title Bar */}
            <div className="bg-[#104080] text-white px-2 py-1 flex items-center justify-between text-[11px] font-bold select-none cursor-move">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#104080]"></div>
                </div>
                FINCORE Credit Entry Management Module
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border-t border-l border-white border-b border-r border-[#8f8f9d] hover:bg-[#d4d0c8]"
              >
                X
              </button>
            </div>


      {/* 3. Main Body */}
      <div className="flex-1 bg-white border border-[#a0a0a0] m-1 p-3 flex flex-col overflow-auto">
        
        {/* ===================== TAB 1: STEPPER WIZARD ===================== */}
        {activeMainTab === 'stepper' && (
          <div className="flex-1 flex flex-col">
            
            {/* Retro 2004 Stepper Progress Bar */}
            <div className="bg-[#f0f0f5] border border-[#7f9db9] p-2 mb-3 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]">
              <div className="flex items-center justify-between text-[11px] mb-1.5 font-bold text-[#1e4676]">
                <div className="flex items-center gap-2">
                  <span className="bg-[#1e4676] text-white px-2 py-0.5 text-[10px]">
                    STAGE {currentStep} OF 4
                  </span>
                  <span>Credit Entry Data Input Workflow</span>
                </div>
                <div className="text-[11px] text-gray-700">
                  Target Amount: <span className="font-bold text-[#1e4676]">₹ {totalEnteredAmount.toLocaleString()}</span> | 
                  Allocated UTR: <span className="font-bold text-green-700">₹ {totalUtrAllocated.toLocaleString()}</span>
                  {remainingUtrBalance !== 0 && (
                    <span className="text-red-600 font-bold ml-1"> (Bal: ₹{remainingUtrBalance.toLocaleString()})</span>
                  )}
                </div>
              </div>

              {/* Step Tabs Indicator */}
              <div className="grid grid-cols-3 gap-1.5">
                {stepsList.map(step => {
                  const isActive = currentStep === step.num;
                  const isDone = currentStep > step.num;
                  return (
                    <div
                      key={step.num}
                      onClick={() => {
                        if (isDone || isActive) setCurrentStep(step.num);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 border text-[11px] select-none transition-none cursor-pointer ${
                        isActive 
                          ? 'bg-[#104080] text-white border-[#0b2b57] font-bold shadow-sm'
                          : isDone
                            ? 'bg-[#e2f0d9] text-[#276a3c] border-[#a9d18e] font-semibold'
                            : 'bg-[#e4e4e4] text-[#666] border-[#c0c0c0]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isActive 
                            ? 'bg-white text-[#104080]' 
                            : isDone 
                              ? 'bg-[#276a3c] text-white' 
                              : 'bg-gray-300 text-gray-700'
                        }`}>
                          {isDone ? '✓' : step.num}
                        </span>
                        <span className="truncate">{step.label}</span>
                      </div>
                      {isDone && <span className="text-[10px] text-green-800 font-bold ml-1">DONE</span>}
                      {isActive && <span className="text-[10px] bg-yellow-300 text-black px-1 font-bold">ACTIVE</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error banner if any */}
            {Object.keys(stepErrors).length > 0 && (
              <div className="bg-[#fff0f0] border-2 border-red-500 p-2 mb-3 text-[11px] text-red-700">
                <div className="font-bold flex items-center gap-1">
                  <span>⚠ Validation Required:</span>
                </div>
                <ul className="list-disc list-inside mt-0.5">
                  {Object.values(stepErrors).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* STEP 1: Beneficiary & Bank Info */}
            {currentStep === 1 && (
              <div className="flex-1 flex flex-col">
                <div className="bg-[#eaf0f8] px-2 py-1 font-bold text-[#104080] border-y border-[#a2b5cd] mb-3 text-[12px] flex items-center justify-between">
                  <span>Step 1: Beneficiary & Bank Account Details (Section 13.1)</span>
                  <span className="text-[11px] font-normal text-gray-600">* Indicates mandatory fields</span>
                </div>

                <div className="grid grid-cols-2 gap-x-10 gap-y-2.5 w-full text-[11px] p-1">
                  
                  {/* Beneficiary Name */}
                  <div className="flex items-center">
                    <span className="w-40 font-semibold text-black">
                      Beneficiary Name <span className="text-red-600">*</span>
                    </span>
                    <div className="flex-1 flex flex-col">
                      <input 
                        type="text" 
                        value={formData.beneficiaryName}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          beneficiaryName: e.target.value,
                          transactionDate: formData.transactionDate
                        })}
                        placeholder="e.g. IBRAHIM KALEEL N A"
                        className="border border-[#7f9db9] px-2 h-[26px] focus:outline-none uppercase font-semibold text-[11px] w-full"
                      />
                    </div>
                  </div>

                  {/* Transaction Date */}
                  <div className="flex items-center">
                    <span className="w-40 font-semibold text-black">
                      Transaction Date
                    </span>
                    <input 
                      type="date" 
                      value={formData.transactionDate}
                      onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                      
                      className="flex-1 border border-[#7f9db9] px-2 h-[26px] focus:outline-none uppercase text-[11px]"
                    />
                  </div>

                  {/* Account Number */}
                  <div className="flex items-center">
                    <span className="w-40 font-semibold text-black">
                      Account Number <span className="text-red-600">*</span>
                    </span>
                    <input 
                      type="text" 
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      placeholder="e.g. 40617101127003"
                      className="flex-1 border border-[#7f9db9] px-2 h-[26px] focus:outline-none font-mono text-[12px] font-bold text-[#1e4676]"
                    />
                  </div>


                  {/* IFSC Code */}
                  <div className="flex items-center">
                    <span className="w-40 font-semibold text-black">
                      IFSC Code <span className="text-red-600">*</span>
                    </span>
                    <input 
                      type="text" 
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                      placeholder="e.g. KLGB0040617"
                      maxLength={11}
                      className="flex-1 border border-[#7f9db9] px-2 h-[26px] focus:outline-none uppercase font-mono font-bold text-[#1e4676] text-[12px]"
                    />
                  </div>

                  {/* Bank Name */}
                  <div className="flex items-center">
                    <span className="w-40 font-semibold text-black">
                      Bank Name <span className="text-red-600">*</span>
                    </span>
                    <input 
                      type="text" 
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="e.g. KERALA GRAMIN BANK"
                      className="flex-1 border border-[#7f9db9] px-2 h-[26px] focus:outline-none uppercase font-semibold text-[11px]"
                    />
                  </div>

                  {/* Branch Name / Location */}
                  <div className="flex items-center">
                    <span className="w-40 font-semibold text-black">Branch / City</span>
                    <input 
                      type="text" 
                      value={formData.branchName}
                      onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                      placeholder="e.g. Kasaragod Main Branch"
                      className="flex-1 border border-[#7f9db9] px-2 h-[26px] focus:outline-none text-[11px]"
                    />
                  </div>

                </div>

                {/* Info Note */}
                <div className="mt-4 p-2 bg-[#f4f7f9] border border-[#a0a0a0] text-[11px] text-gray-700 w-full">
                  <div className="font-bold text-[#1e4676] mb-0.5">ℹ Banking Validation Note:</div>
                  Beneficiary details are validated against standard Indian Banking IFSC clearing formats.
                  Once verified, the payout amount will be scheduled in Step 2.
                </div>
              </div>
            )}

            {/* STEP 2: Payment & Source Account */}
            {currentStep === 2 && (
              <div className="flex-1 flex flex-col">
                <div className="bg-[#eaf0f8] px-2 py-1 font-bold text-[#104080] border-y border-[#a2b5cd] mb-3 text-[12px] flex items-center justify-between">
                  <span>Step 2: Payment Amount & Originating Company Bank Account</span>
                  <span className="text-[11px] font-normal text-gray-600">* Indicates mandatory fields</span>
                </div>

                <div className="grid grid-cols-2 gap-x-10 gap-y-2.5 w-full text-[11px] p-1">
                  
                  {/* Total Outgoing Amount */}
                  <div className="flex items-center">
                    <span className="w-44 font-semibold text-black">
                      Total Amount (INR) <span className="text-red-600">*</span>
                    </span>
                    <div className="flex-1 flex items-center">
                      <span className="bg-[#d4d0c8] border border-r-0 border-[#7f9db9] px-2 h-[26px] flex items-center font-bold text-black text-[11px]">
                        ₹
                      </span>
                      <input 
                        type="number" 
                        value={formData.totalAmount}
                        onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                        placeholder="e.g. 44000"
                        className="flex-1 border border-[#7f9db9] px-2 h-[26px] focus:outline-none font-bold text-[#1e4676] text-[13px]"
                      />
                    </div>
                  </div>

                  {/* Payment Value Date */}
                  <div className="flex items-center">
                    <span className="w-44 font-semibold text-black">
                      Payment Value Date <span className="text-red-600">*</span>
                    </span>
                    <input 
                      type="date" 
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                      className="flex-1 border border-[#7f9db9] px-2 h-[26px] focus:outline-none text-[11px]"
                    />
                  </div>

                  {/* Amount in words banner */}
                  <div className="col-span-2 bg-[#fdfbe8] border border-[#d3c06d] p-2 flex items-center gap-2">
                    <span className="font-bold text-[#745e06] text-[11px]">Amount in Words:</span>
                    <span className="font-bold text-[#1e4676] text-[12px] italic">
                      {numberToIndianWords(totalEnteredAmount) || 'Zero Rupees'}
                    </span>
                  </div>

                </div>

                {/* Accounting Impact Preview Box */}
                <div className="mt-4 p-2 bg-[#f0f4f8] border border-[#8fa8c0] text-[11px] text-black w-full">
                  <div className="font-bold text-[#1e4676] mb-1">
                    SRS 13.3 Accounting Impact Notification:
                  </div>
                  This payment will credit <span className="font-bold text-[#1e4676]">{formData.beneficiaryName}</span> and debit the originating treasury account <span className="font-bold">{formData.companyBankAccount}</span>.
                </div>
              </div>
            )}

            {/* STEP 3: UTR & Settlement Breakdown */}
            {currentStep === 2 && (
              <div className="bg-[#f8f9fa] border border-[#a0a0a0] p-4 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-3 self-end">
                      <button 
                        onClick={() => {
                          setUtrItems([
                            { id: 'u1', amount: 24000, utrNumber: '005624886268', status: 'Completed', timestamp: '2026-10-07 10:14' },
                            { id: 'u2', amount: 20000, utrNumber: '293973571072', status: 'Completed', timestamp: '2026-10-07 10:28' }
                          ]);
                          setFormData({ ...formData, totalAmount: '44000' });
                        }}
                        className="bg-[#d4d0c8] border border-gray-500 px-3 py-1 text-[11px] text-black hover:bg-[#eaeaea] font-bold"
                      >
                        Preset: 24,000 + 20,000 Split
                      </button>
                      <button 
                        onClick={handleAddUtrRow}
                        className="bg-[#316ac5] text-white px-3 py-1 text-[11px] font-bold border border-[#1e4676] hover:bg-[#2055a4]"
                      >
                        + Add UTR Row
                      </button>
                    </div>

                    {/* Allocation Balance Banner */}
                    <div className={`p-3 border mb-4 flex items-center justify-between text-[11px] ${
                      Math.abs(remainingUtrBalance) < 0.01 
                        ? 'bg-[#e2f0d9] border-[#a9d18e] text-[#276a3c]' 
                        : 'bg-[#fff2cc] border-[#ffe599] text-[#b25900]'
                    }`}>
                      <div className="flex items-center gap-6">
                        <div>
                          Total Target Amount: <strong className="text-[13px]">₹ {totalEnteredAmount.toLocaleString()}</strong>
                        </div>
                        <div>
                          Sum of Entered UTRs: <strong className="text-[13px]">₹ {totalUtrAllocated.toLocaleString()}</strong>
                        </div>
                        <div>
                          Difference Remaining: <strong className={`text-[13px] ${remainingUtrBalance !== 0 ? 'text-red-600' : 'text-green-700'}`}>
                            ₹ {remainingUtrBalance.toLocaleString()}
                          </strong>
                        </div>
                      </div>

                      <div className="font-bold flex items-center gap-1">
                        {Math.abs(remainingUtrBalance) < 0.01 ? (
                          <span className="flex items-center gap-1 bg-[#276a3c] text-white px-3 py-1 text-[11px]">
                            ✓ 100% BALANCED & READY (Completed)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 text-[11px]">
                            ⚠ Discrepancy of ₹ {remainingUtrBalance.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* UTR Table */}
                    <div className="border border-[#a0a0a0] bg-white overflow-hidden shadow-sm">
                      <table className="w-full border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#d4d0c8] border-b border-[#a0a0a0] text-left text-black">
                            <th className="p-2.5 border-r border-[#a0a0a0] w-12 text-center">Tranche</th>
                            <th className="p-2.5 border-r border-[#a0a0a0] w-48">Amount (INR) *</th>
                            <th className="p-2.5 border-r border-[#a0a0a0]">UTR Number (Bank Ref) *</th>
                            <th className="p-2.5 border-r border-[#a0a0a0] w-36">Status</th>
                            <th className="p-2.5 border-r border-[#a0a0a0] w-40">Timestamp</th>
                            <th className="p-2.5 w-20 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {utrItems.map((item, index) => (
                            <tr key={item.id || index} className="border-b border-[#e4e4e4] hover:bg-[#f9fafb]">
                              <td className="p-2 border-r border-[#e4e4e4] text-center font-bold text-[#1e4676]">
                                #{index + 1}
                              </td>
                              <td className="p-2 border-r border-[#e4e4e4]">
                                <div className="flex items-center">
                                  <span className="bg-[#f0f0f0] border border-r-0 border-[#7f9db9] px-2 h-[26px] flex items-center text-[11px] text-gray-700">₹</span>
                                  <input 
                                    type="number" 
                                    value={item.amount || ''}
                                    onChange={(e) => handleUtrChange(index, 'amount', parseFloat(e.target.value) || 0)}
                                    placeholder="Amount"
                                    className="w-full border border-[#7f9db9] px-2 h-[26px] focus:outline-none font-bold text-[#1e4676]"
                                  />
                                </div>
                              </td>
                              <td className="p-2 border-r border-[#e4e4e4]">
                                <input 
                                  type="text" 
                                  value={item.utrNumber}
                                  onChange={(e) => handleUtrChange(index, 'utrNumber', e.target.value)}
                                  placeholder="e.g. 005624886268 or 293973571072"
                                  className="w-full border border-[#7f9db9] px-2 h-[26px] focus:outline-none font-mono font-bold text-black"
                                />
                              </td>
                              <td className="p-2 border-r border-[#e4e4e4]">
                                <select 
                                  value={item.status}
                                  onChange={(e) => handleUtrChange(index, 'status', e.target.value)}
                                  className="w-full border border-[#7f9db9] bg-white px-1 h-[26px] focus:outline-none text-[11px] font-semibold text-green-700"
                                >
                                  <option value="Completed">Completed</option>
                                  <option value="Pending">Pending</option>
                                  <option value="Failed">Failed</option>
                                </select>
                              </td>
                              <td className="p-2 border-r border-[#e4e4e4] text-gray-600 text-[10px]">
                                {item.timestamp || 'Auto on save'}
                              </td>
                              <td className="p-2 text-center">
                                <button 
                                  onClick={() => handleRemoveUtrRow(index)}
                                  disabled={utrItems.length <= 1}
                                  title="Delete UTR row"
                                  className={`px-3 py-1 text-[10px] border font-bold ${
                                    utrItems.length <= 1 
                                      ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' 
                                      : 'bg-[#ffebee] text-[#c62828] border-[#ef9a9a] hover:bg-[#ffcdd2]'
                                  }`}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-[#e4e9f0] font-bold text-black border-t border-[#a0a0a0]">
                            <td className="p-2.5 text-center" colSpan={1}>Total</td>
                            <td className="p-2.5 text-[#1e4676] font-mono text-[13px]">₹ {totalUtrAllocated.toLocaleString()}</td>
                            <td className="p-2.5 text-gray-700" colSpan={4}>
                              {utrItems.length} linked UTR transaction(s) entered
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Example helper banner */}
                    <div className="mt-4 p-3 bg-white border border-dashed border-[#a0a0a0] flex items-center justify-between text-[11px] shadow-sm">
                      <div>
                        <span className="font-bold text-[#1e4676]">Client Reference Example:</span>
                        <span className="ml-2 font-mono text-gray-800">44,000 Total | 24,000-005624886268 | 20,000-293973571072 (Completed)</span>
                      </div>
                      <button 
                        onClick={() => {
                          if (remainingUtrBalance > 0) {
                            setUtrItems([
                              ...utrItems,
                              {
                                id: `utr-${Date.now()}`,
                                amount: remainingUtrBalance,
                                utrNumber: '',
                                status: 'Completed',
                                timestamp: new Date().toLocaleString()
                              }
                            ]);
                          }
                        }}
                        disabled={remainingUtrBalance <= 0}
                        className="text-[#104080] underline font-bold disabled:text-gray-400 text-[12px]"
                      >
                        + Allocate remaining balance (₹{Math.max(0, remainingUtrBalance).toLocaleString()})
                      </button>
                    </div>
              </div>
            )}

            {/* STEP 3: Verification & Ledger Post */}
            {currentStep === 3 && (
              <div className="flex-1 flex flex-col">
                <div className="bg-[#eaf0f8] px-2 py-1 font-bold text-[#104080] border-y border-[#a2b5cd] mb-3 text-[12px] flex items-center justify-between">
                  <span>Step 4: Review Payment Voucher & FINCORE Accounting Posting</span>
                  <span className="text-green-700 font-bold text-[11px] flex items-center gap-1">
                    ✓ All Validation Checks Passed
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[11px] mb-3">
                  {/* Summary Box 1: Beneficiary */}
                  <div className="border border-[#7f9db9] p-3 bg-[#fafbfc]">
                    <div className="font-bold text-[#1e4676] border-b border-[#c8d6e5] pb-1 mb-2 text-[12px]">
                      Beneficiary Particulars
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-y-1.5">
                      <span className="text-gray-600 font-semibold">Beneficiary Name:</span>
                      <span className="font-bold text-black uppercase">{formData.beneficiaryName}</span>

                      <span className="text-gray-600 font-semibold">Account Number:</span>
                      <span className="font-mono font-bold text-[#1e4676]">{formData.accountNumber}</span>

                      <span className="text-gray-600 font-semibold">IFSC Code:</span>
                      <span className="font-mono font-bold">{formData.ifscCode}</span>

                      <span className="text-gray-600 font-semibold">Bank Name:</span>
                      <span className="font-semibold text-black uppercase">{formData.bankName}</span>

                      <span className="text-gray-600 font-semibold">Branch:</span>
                      <span>{formData.branchName || 'Not specified'}</span>
                    </div>
                  </div>

                  {/* Summary Box 2: Payment Details */}
                  <div className="border border-[#7f9db9] p-3 bg-[#fafbfc]">
                    <div className="font-bold text-[#1e4676] border-b border-[#c8d6e5] pb-1 mb-2 text-[12px]">
                      Payment & Settlement Summary
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-y-1.5">
                      <span className="text-gray-600 font-semibold">Total Amount:</span>
                      <span className="font-bold text-[#1e4676] text-[13px]">₹ {totalEnteredAmount.toLocaleString()}</span>

                      <span className="text-gray-600 font-semibold">Amount In Words:</span>
                      <span className="italic font-semibold text-gray-800">{numberToIndianWords(totalEnteredAmount)}</span>

                      <span className="text-gray-600 font-semibold">Payment Mode:</span>
                      <span className="font-semibold">{formData.paymentMode}</span>

                      <span className="text-gray-600 font-semibold">Source Account:</span>
                      <span className="font-semibold text-black">{formData.companyBankAccount}</span>

                      <span className="text-gray-600 font-semibold">Value Date:</span>
                      <span>{formData.paymentDate}</span>
                    </div>
                  </div>
                </div>

                {/* UTR Breakdown in Step 4 */}
                <div className="border border-[#7f9db9] p-2 bg-white mb-3">
                  <div className="font-bold text-[#1e4676] text-[11px] mb-1">
                    Linked Bank UTR Records ({utrItems.length} Tranches):
                  </div>
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#e4e4e4] border border-[#a0a0a0]">
                        <th className="p-1.5 text-left border-r border-[#a0a0a0]">#</th>
                        <th className="p-1.5 text-left border-r border-[#a0a0a0]">Amount</th>
                        <th className="p-1.5 text-left border-r border-[#a0a0a0]">UTR Number</th>
                        <th className="p-1.5 text-left border-r border-[#a0a0a0]">Status</th>
                        <th className="p-1.5 text-left">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {utrItems.map((u, i) => (
                        <tr key={i} className="border-b border-[#e4e4e4]">
                          <td className="p-1.5 border-r border-[#e4e4e4] font-bold">{i + 1}</td>
                          <td className="p-1.5 border-r border-[#e4e4e4] font-bold text-[#1e4676]">₹ {u.amount.toLocaleString()}</td>
                          <td className="p-1.5 border-r border-[#e4e4e4] font-mono font-bold">{u.utrNumber}</td>
                          <td className="p-1.5 border-r border-[#e4e4e4] text-green-700 font-bold">{u.status}</td>
                          <td className="p-1.5 text-gray-600 text-[10px]">{u.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Accounting Journal Entry Preview (SRS 13.3) */}
                <div className="border border-[#285f8f] bg-[#eef5fa] p-2.5 text-[11px]">
                  <div className="font-bold text-[#1e4676] mb-1 flex items-center justify-between">
                    <span>FINCORE General Ledger Double Entry Post Preview (SRS Section 13.3)</span>
                    <span className="text-[10px] bg-[#1e4676] text-white px-2 py-0.5">Automated Double Entry</span>
                  </div>
                  <div className="font-mono text-[11px] bg-white border border-[#bed3e6] p-2 leading-relaxed">
                    <div className="text-blue-900">
                      <strong>DR.</strong> Outgoing Payment / Beneficiary Settlement: <span className="text-black font-bold">₹ {totalEnteredAmount.toLocaleString()}</span>
                    </div>
                    <div className="text-green-900 ml-4">
                      <strong>CR.</strong> Bank Account ({formData.companyBankAccount}): <span className="text-black font-bold">₹ {totalEnteredAmount.toLocaleString()}</span>
                    </div>
                    <div className="text-gray-600 mt-1 text-[10px]">
                      Narration: Being credit payment made to {formData.beneficiaryName} [A/C: {formData.accountNumber}] via UTR(s): {utrItems.map(u => u.utrNumber).join(', ')}.
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Stepper Navigation Buttons (2004 Finacle 3D Bevel Buttons) */}
            <div className="mt-4 pt-3 border-t border-[#a0a0a0] flex items-center justify-between bg-[#f8f9fa] p-2">
              <div className="flex gap-2">
                <button
                  onClick={handleClearForm}
                  className="bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-3 py-1 text-xs text-black"
                >
                  Clear Form
                </button>
                <button
                  onClick={handleLoadUserSample}
                  className="bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-3 py-1 text-xs text-[#1e4676] font-bold"
                >
                  Reset To Client Sample
                </button>
              </div>

              <div className="flex gap-2">
                {currentStep > 1 && (
                  <button
                    onClick={handlePrevStep}
                    className="bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-4 py-1 text-xs font-bold text-black flex items-center gap-1 active:border-t-[#8f8f9d] active:border-l-[#8f8f9d] active:border-b-white active:border-r-white"
                  >
                    ◀ Previous Step
                  </button>
                )}

                {currentStep < 3 ? (
                  <button
                    onClick={handleNextStep}
                    className="bg-[#316ac5] text-white border-t-2 border-l-2 border-[#6ba4f8] border-b-2 border-r-2 border-b-[#103b78] border-r-[#103b78] hover:bg-[#2055a4] px-5 py-1 text-xs font-bold flex items-center gap-1 active:border-t-[#103b78] active:border-l-[#103b78]"
                  >
                    Next Step ▶
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="bg-[#1e7e34] text-white border-t-2 border-l-2 border-[#5cb85c] border-b-2 border-r-2 border-b-[#145523] border-r-[#145523] hover:bg-[#218838] px-6 py-1.5 text-xs font-extrabold flex items-center gap-1 shadow-sm"
                  >
                    ✓ POST & COMPLETE CREDIT ENTRY (ENTER)
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ===================== TAB 2: INQUIRY & LIST VIEW ===================== */}
        {activeMainTab === 'inquiry' && (
          <div className="flex-1 flex flex-col">
            
            {/* Search & Filter Toolbar */}
            <div className="bg-[#f0f0f5] border border-[#7f9db9] p-2 mb-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[#1e4676]">Search:</span>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Name, A/C, UTR, or Entry No..."
                    className="w-[260px] border border-[#7f9db9] px-2 h-[24px] focus:outline-none text-[11px]"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="font-semibold text-black">Payment Mode:</span>
                  <select 
                    value={filterMode} 
                    onChange={(e) => setFilterMode(e.target.value)}
                    className="border border-[#7f9db9] bg-white px-1 h-[24px] text-[11px]"
                  >
                    <option value="ALL">All Modes</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="RTGS">RTGS</option>
                    <option value="NEFT">NEFT</option>
                    <option value="IMPS">IMPS</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <span className="font-semibold text-black">Status:</span>
                  <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-[#7f9db9] bg-white px-1 h-[24px] text-[11px]"
                  >
                    <option value="ALL">All Status</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleExportCsv}
                  className="bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-2.5 py-1 text-[11px] font-bold text-black"
                >
                  📥 Export to Excel / CSV
                </button>
                <button 
                  onClick={() => {
                    handleClearForm();
                    setActiveMainTab('stepper');
                  }}
                  className="bg-[#316ac5] text-white border border-[#1e4676] px-3 py-1 text-[11px] font-bold hover:bg-[#2055a4]"
                >
                  + New Credit Entry
                </button>
              </div>
            </div>

            {/* Entries Data Table */}
            <div className="flex-1 bg-white border border-[#a0a0a0] overflow-auto">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[#d4d0c8] border-b border-[#a0a0a0] text-left text-black font-bold">
                    <th className="p-2 border-r border-[#a0a0a0] w-28">Entry No</th>
                    <th className="p-2 border-r border-[#a0a0a0] w-24">Date</th>
                    <th className="p-2 border-r border-[#a0a0a0]">Beneficiary Name</th>
                    <th className="p-2 border-r border-[#a0a0a0] w-32 font-mono">Account No</th>
                    <th className="p-2 border-r border-[#a0a0a0]">Bank & IFSC</th>
                    <th className="p-2 border-r border-[#a0a0a0] w-28 text-right">Amount (INR)</th>
                    <th className="p-2 border-r border-[#a0a0a0]">Linked UTR(s)</th>
                    <th className="p-2 border-r border-[#a0a0a0] w-24">Mode</th>
                    <th className="p-2 border-r border-[#a0a0a0] w-24 text-center">Status</th>
                    <th className="p-2 border-r border-[#a0a0a0] text-center">Issued By</th>
                    <th className="p-2 border-r border-[#a0a0a0] text-center">Verified By</th>
                    <th className="p-2 w-28 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-6 text-center text-gray-500 italic">
                        No credit entry records matched your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map(entry => (
                      <tr key={entry.id} className="border-b border-[#e4e4e4] hover:bg-[#f0f4f8]">
                        <td className="p-2 border-r border-[#e4e4e4] font-bold text-[#1e4676]">
                          {entry.id}
                        </td>
                        <td className="p-2 border-r border-[#e4e4e4] text-gray-700">
                          {entry.paymentDate}
                        </td>
                        <td className="p-2 border-r border-[#e4e4e4] font-bold text-black uppercase">
                          {entry.beneficiaryName}
                        </td>
                        <td className="p-2 border-r border-[#e4e4e4] font-mono text-[#1e4676]">
                          {entry.accountNumber.length > 6 
                            ? `••••${entry.accountNumber.slice(-6)}` 
                            : entry.accountNumber}
                        </td>
                        <td className="p-2 border-r border-[#e4e4e4]">
                          <div className="font-semibold">{entry.bankName}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{entry.ifscCode}</div>
                        </td>
                        <td className="p-2 border-r border-[#e4e4e4] text-right font-bold text-[#1e4676] font-mono">
                          ₹ {entry.totalAmount.toLocaleString()}
                        </td>
                        <td className="p-2 border-r border-[#e4e4e4]">
                          <div className="flex flex-col gap-0.5">
                            {entry.utrItems.map((u, idx) => (
                              <div key={idx} className="flex items-center gap-1 font-mono text-[10px]">
                                <span className="bg-gray-100 border border-gray-300 px-1 font-bold">{u.utrNumber}</span>
                                <span className="text-[#1e4676]">(₹{u.amount.toLocaleString()})</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-2 border-r border-[#e4e4e4] text-gray-700">
                          {entry.paymentMode}
                        </td>
                        <td className="p-2 border-r border-[#e4e4e4] text-center">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-none border ${
                            entry.status === 'Completed'
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : entry.status === 'Cancelled'
                                ? 'bg-red-100 text-red-800 border-red-300'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                          }`}>
                            {entry.status} {entry.status === 'Completed' && ''}
                          </span>
                        </td>
                        <td className="p-2 border-r border-[#e4e4e4] text-center text-gray-700">
                          {entry.createdBy || '-'}
                        </td>
                        <td className="p-2 border-r border-[#e4e4e4] text-center text-gray-700">
                          -
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleEditEntry(entry)}
                              title="Edit Entry"
                              className="text-[#1a4a8c] hover:underline font-bold text-[11px]"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleCancelEntry(entry.id)}
                              title="Cancel/Void Entry"
                              className="text-orange-600 hover:underline font-bold text-[11px]"
                              disabled={entry.status === 'Cancelled'}
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleDeleteEntry(entry.id)}
                              title="Delete Entry"
                              className="text-red-600 hover:underline font-bold text-[11px]"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* List footer info */}
            <div className="bg-[#f8f9fa] border-t border-[#a0a0a0] p-1.5 mt-1 flex items-center justify-between text-[11px] text-gray-700">
              <div>
                Showing <strong>{filteredEntries.length}</strong> of <strong>{entries.length}</strong> total credit entries.
              </div>
              <div className="font-bold text-[#1e4676]">
                Total Outgoing Sum: ₹ {filteredEntries.filter(e => e.status !== 'Cancelled').reduce((sum, e) => sum + e.totalAmount, 0).toLocaleString()}
              </div>
            </div>

          </div>
        )}

        {/* ===================== TAB 3: REPORTS & AUDIT ===================== */}
        {activeMainTab === 'reports' && (
          <div className="flex-1 flex flex-col text-[11px]">
            <div className="bg-[#eaf0f8] px-2 py-1 font-bold text-[#104080] border-y border-[#a2b5cd] mb-3 text-[12px] flex items-center justify-between">
              <span>Section 13.5 — Outgoing Credit Entry Financial Reporting & Audit Trail</span>
              <button 
                onClick={handleExportCsv}
                className="bg-[#e4e4f0] border border-gray-400 px-2 py-0.5 text-[11px] font-bold text-black"
              >
                Export Complete Audit Sheet
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="border border-[#7f9db9] p-3 bg-[#fafbfc]">
                <div className="text-gray-500 text-[10px] uppercase font-bold">Total Outgoing Disbursed</div>
                <div className="text-[18px] font-bold text-[#1e4676] font-mono mt-1">
                  ₹ {entries.filter(e => e.status === 'Completed').reduce((s, e) => s + e.totalAmount, 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-green-700 mt-0.5">Reflected in FINCORE Treasury</div>
              </div>

              <div className="border border-[#7f9db9] p-3 bg-[#fafbfc]">
                <div className="text-gray-500 text-[10px] uppercase font-bold">Total Completed Transactions</div>
                <div className="text-[18px] font-bold text-[#1e4676] mt-1">
                  {entries.filter(e => e.status === 'Completed').length}
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5">100% verified settlement</div>
              </div>

              <div className="border border-[#7f9db9] p-3 bg-[#fafbfc]">
                <div className="text-gray-500 text-[10px] uppercase font-bold">Linked Banking UTRs</div>
                <div className="text-[18px] font-bold text-[#1e4676] mt-1">
                  {entries.reduce((s, e) => s + e.utrItems.length, 0)}
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5">Across all tranches</div>
              </div>

              <div className="border border-[#7f9db9] p-3 bg-[#fafbfc]">
                <div className="text-gray-500 text-[10px] uppercase font-bold">Audit History Records</div>
                <div className="text-[18px] font-bold text-[#1e4676] mt-1">
                  {entries.length} Entries
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5">Zero destructive deletions</div>
              </div>
            </div>

            <div className="border border-[#a0a0a0] bg-white p-3 flex-1 overflow-auto">
              <div className="font-bold text-[#1e4676] text-[12px] mb-2 border-b border-gray-200 pb-1">
                UTR-Wise Payment Breakdown & Audit Log (SRS 13.5)
              </div>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[#d4d0c8] border-b border-[#a0a0a0] text-left">
                    <th className="p-1.5 border-r border-[#a0a0a0]">UTR Number</th>
                    <th className="p-1.5 border-r border-[#a0a0a0]">Tranche Amount</th>
                    <th className="p-1.5 border-r border-[#a0a0a0]">Beneficiary Name</th>
                    <th className="p-1.5 border-r border-[#a0a0a0]">Target Bank & IFSC</th>
                    <th className="p-1.5 border-r border-[#a0a0a0]">Source Treasury Account</th>
                    <th className="p-1.5 border-r border-[#a0a0a0]">Entry ID</th>
                    <th className="p-1.5 border-r border-[#a0a0a0]">Issued By</th>
                    <th className="p-1.5">Verified By</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.flatMap(entry => 
                    entry.utrItems.map((u, idx) => (
                      <tr key={`${entry.id}-${idx}`} className="border-b border-[#e4e4e4] hover:bg-[#f9fafb]">
                        <td className="p-1.5 border-r border-[#e4e4e4] font-mono font-bold text-black">{u.utrNumber}</td>
                        <td className="p-1.5 border-r border-[#e4e4e4] font-mono font-bold text-[#1e4676]">₹ {u.amount.toLocaleString()}</td>
                        <td className="p-1.5 border-r border-[#e4e4e4] font-semibold">{entry.beneficiaryName}</td>
                        <td className="p-1.5 border-r border-[#e4e4e4]">{entry.bankName} ({entry.ifscCode})</td>
                        <td className="p-1.5 border-r border-[#e4e4e4]">{entry.companyBankAccount}</td>
                        <td className="p-1.5 border-r border-[#e4e4e4] font-bold text-[#1e4676]">{entry.id}</td>
                        <td className="p-1.5 border-r border-[#e4e4e4]">{entry.createdBy || '-'}</td>
                        <td className="p-1.5">-</td>
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
      )}
      {/* ===================== MODAL: SUCCESS CONFIRMATION (Classic 2004 Finacle Dialog) ===================== */}
      {submittedEntry && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-[#d4d0c8] p-1 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#404040] border-r-[#404040] shadow-2xl w-full max-w-lg">
            
            {/* Windows 2000/XP Titlebar */}
            <div className="bg-gradient-to-r from-[#0055ea] via-[#0860f6] to-[#3a90f8] px-2 py-1 flex items-center justify-between text-white font-bold text-[12px]">
              <span>Finacle Core Banking System - Transaction Confirmation</span>
              <button 
                onClick={() => setSubmittedEntry(null)}
                className="w-4 h-4 bg-[#d4d0c8] border border-gray-500 text-black text-[10px] flex items-center justify-center hover:bg-white leading-none"
              >
                ✕
              </button>
            </div>

            {/* Inner Content Area */}
            <div className="bg-[#f0f0f5] border border-[#8f8f9d] p-4 m-1 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#4facfe] to-[#00f2fe] flex items-center justify-center text-white font-serif italic font-extrabold text-lg shadow-sm border border-[#00a8ff] shrink-0">
                  i
                </div>
                <div className="text-[12px] text-black">
                  <div className="font-bold text-[13px] text-[#1e4676] mb-1">
                    Credit Entry {submittedEntry.id} Posted Successfully.
                  </div>
                  <div>Beneficiary: <strong>{submittedEntry.beneficiaryName}</strong> (A/C: {submittedEntry.accountNumber})</div>
                  <div>Bank: <strong>{submittedEntry.bankName}</strong> ({submittedEntry.ifscCode})</div>
                  <div className="text-green-800 font-bold mt-1">
                    Total Amount: ₹ {submittedEntry.totalAmount.toLocaleString()} • Status: Completed
                  </div>
                  <div className="mt-1 text-[11px] bg-white border border-[#a0a0a0] p-1.5 font-mono">
                    Linked UTR(s):
                    {submittedEntry.utrItems.map((u, i) => (
                      <div key={i} className="text-black font-semibold">
                        • UTR {u.utrNumber}: ₹ {u.amount.toLocaleString()} ({u.status})
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-gray-600 mt-1">
                    Ledger balanced per SRS 13.3. Cash and bank accounting impact recorded.
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-300">
                <button
                  onClick={() => {
                    const e = submittedEntry;
                    setSubmittedEntry(null);
                    setSelectedVoucher(e);
                  }}
                  className="bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-3 py-1 text-xs text-black font-bold"
                >
                  Print Voucher
                </button>
                <button
                  onClick={() => {
                    setSubmittedEntry(null);
                    setActiveMainTab('inquiry');
                  }}
                  className="bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-4 py-1 text-xs text-black font-bold"
                >
                  Ok
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ===================== MODAL: PAYMENT VOUCHER / ADVICE ===================== */}
      {selectedVoucher && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-[#d4d0c8] p-1 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#404040] border-r-[#404040] shadow-2xl w-full max-w-2xl">
            
            <div className="bg-gradient-to-r from-[#104080] to-[#2563eb] px-2 py-1 flex items-center justify-between text-white font-bold text-[12px]">
              <span>Credit Payment Voucher Advice — {selectedVoucher.id}</span>
              <button 
                onClick={() => setSelectedVoucher(null)}
                className="w-4 h-4 bg-[#d4d0c8] border border-gray-500 text-black text-[10px] flex items-center justify-center hover:bg-white"
              >
                ✕
              </button>
            </div>

            <div className="bg-white border border-[#8f8f9d] p-5 m-1 text-black font-sans">
              
              {/* Voucher Header */}
              <div className="border-b-2 border-[#1e4676] pb-3 mb-3 flex items-start justify-between">
                <div>
                  <div className="text-[16px] font-bold text-[#1e4676]">INFAZYS FINACLE CORE BANKING</div>
                  <div className="text-[11px] text-gray-600">Universal Payment Solution • Outgoing Credit Settlement Advice</div>
                </div>
                <div className="text-right text-[11px]">
                  <div className="font-bold text-black">ENTRY REF: {selectedVoucher.id}</div>
                  <div className="text-gray-600">Date: {selectedVoucher.paymentDate}</div>
                  <div className="text-green-700 font-bold uppercase">STATUS: {selectedVoucher.status}</div>
                </div>
              </div>

              {/* Voucher Content */}
              <div className="grid grid-cols-2 gap-4 text-[11px] mb-4">
                <div className="border border-gray-300 p-2 bg-[#fbfbfb]">
                  <div className="font-bold text-[#1e4676] mb-1">Beneficiary Credentials</div>
                  <div>Name: <strong>{selectedVoucher.beneficiaryName}</strong></div>
                  <div>Account No: <strong>{selectedVoucher.accountNumber}</strong></div>
                  <div>IFSC: <strong>{selectedVoucher.ifscCode}</strong></div>
                  <div>Bank: <strong>{selectedVoucher.bankName}</strong></div>
                </div>

                <div className="border border-gray-300 p-2 bg-[#fbfbfb]">
                  <div className="font-bold text-[#1e4676] mb-1">Origin & Payment Details</div>
                  <div>Disbursed Amount: <strong className="text-[#1e4676]">₹ {selectedVoucher.totalAmount.toLocaleString()}</strong></div>
                  <div>Payment Mode: <strong>{selectedVoucher.paymentMode}</strong></div>
                  <div>Treasury Account: <strong>{selectedVoucher.companyBankAccount}</strong></div>
                  <div>Maker ID: <strong>{selectedVoucher.createdBy}</strong></div>
                </div>
              </div>

              {/* UTR Settlement Details */}
              <div className="border border-gray-300 p-2 mb-4">
                <div className="font-bold text-[#1e4676] text-[11px] mb-1">Settlement UTR Tranches:</div>
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th className="p-1 text-left">#</th>
                      <th className="p-1 text-left">Amount</th>
                      <th className="p-1 text-left">Bank UTR Ref</th>
                      <th className="p-1 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedVoucher.utrItems.map((u, i) => (
                      <tr key={i} className="border-b border-gray-200">
                        <td className="p-1 font-bold">{i + 1}</td>
                        <td className="p-1 font-bold text-[#1e4676]">₹ {u.amount.toLocaleString()}</td>
                        <td className="p-1 font-mono">{u.utrNumber}</td>
                        <td className="p-1 text-green-700 font-bold">{u.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bank Stamp / Signature */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-300 text-[11px] text-gray-700">
                <div className="border border-green-600 p-1.5 text-center text-green-700 font-bold text-[10px] w-36">
                  ✓ VERIFIED & PAID<br/>FINACLE CORE UBS
                </div>
                <div className="text-right">
                  <div>Authorized Signatory / Checker</div>
                  <div className="font-bold text-black mt-2">UBSADMIN • Operations Branch</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-200">
                <button
                  onClick={() => window.print()}
                  className="bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-4 py-1 text-xs text-black font-bold"
                >
                  🖨 Print Advice
                </button>
                <button
                  onClick={() => setSelectedVoucher(null)}
                  className="bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-4 py-1 text-xs text-black font-bold"
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
