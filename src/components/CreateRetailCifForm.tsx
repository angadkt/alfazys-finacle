import React, { useState, useEffect } from 'react';
import FinacleDatePicker from './FinacleDatePicker';
import { 
  Check, 
  X, 
  UserPlus, 
  User, 
  Phone, 
  MapPin, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  FileText, 
  Eye
} from 'lucide-react';
import api from '../services/api';

export default function CreateRetailCifForm() {
  const [step, setStep] = useState<'selection' | 'form'>('selection');
  const [activeTab, setActiveTab] = useState('Basic Info');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cifId, setCifId] = useState('');
  const [selectedFunction, setSelectedFunction] = useState('A-ADD');
  const [inputCifId, setInputCifId] = useState('');
  const [validationError, setValidationError] = useState('');
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [docFiles, setDocFiles] = useState<Record<string, File>>({});
  const [previewDoc, setPreviewDoc] = useState<{ url: string; label: string; isPdf?: boolean } | null>(null);
  const [selectedPreviewLabel, setSelectedPreviewLabel] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewRotation, setPreviewRotation] = useState(0);
  const [cifTypesList, setCifTypesList] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const fetchCifTypes = async () => {
      try {
        const res = await api.get('/masters/cif_types');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setCifTypesList(res.data);
        }
      } catch (err) {
        console.warn('Could not load cif_types from masters:', err);
      }
    };
    fetchCifTypes();
  }, []);

  const handleFileUpload = (label: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setDocuments(prev => ({ ...prev, [label]: url }));
      setDocFiles(prev => ({ ...prev, [label]: file }));
      setSelectedPreviewLabel(label);
    }
  };

  const [formData, setFormData] = useState({
    // Tab 1: Basic Info
    title: '',
    firstName: '',
    lastName: '',
    shortName: '',
    gender: '',
    nationality: 'India',
    contactNo: '',
    ccy: 'INR',
    branchOffice: 'INDIA',
    cifType: 'Customer',

    // Tab 2: Contact Info
    uaeNo: '',
    email: '',
    indianNo: '',
    whatsappNo: '',
    otherNumber1: '',
    relationship1: '',
    otherNumber2: '',
    relationship2: '',

    // Tab 4: Address Details
    addressFormat: 'Structured',
    addressType: 'PERMANENT',
    houseNo: '',
    premiseName: '',
    buildingLevel: '',
    streetNo: '',
    suburb: '',
    streetName: '',
    locality: '',
    town: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    validFrom: '',
    validTill: '',
    addressProofReceived: 'Yes',
    holdMail: 'N',
    holdMailBy: '',
    businessCenter: '',
    reason: ''
  });

  const handleSubmit = async () => {
    setValidationError('');

    if (
      !formData.title ||
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.shortName.trim() ||
      !formData.gender ||
      !formData.nationality.trim() ||
      !formData.contactNo.trim() ||
      !formData.ccy ||
      !formData.branchOffice ||
      !formData.cifType
    ) {
      setValidationError('Mandatory Fields Missing: Please fill in all required fields marked (*) in the Basic Info tab.');
      setActiveTab('Basic Info');
      return;
    }

    const payload = {
      title: formData.title,
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      short_name: formData.shortName.trim(),
      gender: formData.gender,
      nationality: formData.nationality,
      contact_number: formData.contactNo.trim(),
      ccy: formData.ccy,
      branch_id: formData.branchOffice === 'UAE' ? 1 : 2, 
      cif_type_id: (() => {
        const val = formData.cifType.trim().toUpperCase();
        const matched = cifTypesList.find(ct => ct.name.trim().toUpperCase() === val);
        if (matched) return Number(matched.id);
        if (val === 'AGENT') return 1;
        if (val === 'CUSTOMER') return 2;
        if (val === 'EMPLOYEE') return 3;
        if (val === 'OTHER') return 4;
        if (val === 'SERVICER') return 5;
        if (val === 'PAYMENT DISTRIBUTER' || val === 'PAYMENT_DISTRIBUTER') return 6;
        if (val === 'SUPPLIER') return 7;
        return 2;
      })(),
      email: formData.email.trim(),
      indian_number: formData.indianNo.trim(),
      whatsapp_number: formData.whatsappNo.trim(),
      _profile: {
        contacts: [
          ...(formData.otherNumber1 ? [{ number: formData.otherNumber1.trim(), relationship: formData.relationship1 }] : []),
          ...(formData.otherNumber2 ? [{ number: formData.otherNumber2.trim(), relationship: formData.relationship2 }] : [])
        ],
        addresses: [{
          address_format: formData.addressFormat,
          address_type: formData.addressType,
          house_no: formData.houseNo.trim(),
          premise_name: formData.premiseName.trim(),
          building_level: formData.buildingLevel.trim(),
          street_no: formData.streetNo.trim(),
          suburb: formData.suburb.trim(),
          street_name: formData.streetName.trim(),
          locality: formData.locality.trim(),
          town: formData.town.trim(),
          city: formData.city.trim() || 'Unknown',
          state: formData.state.trim() || 'Unknown',
          country: formData.country.trim() || 'Unknown',
          postal_code: formData.postalCode.trim() || '00000',
          proof_received: formData.addressProofReceived
        }]
      }
    };

    setIsSubmitting(true);
    try {
      const res = await api.post('/records/parties', payload);
      const partyId = res.data.record.id;
      const createdCifNo = res.data.record.cif_no || partyId;
      setCifId(createdCifNo);

      // Upload selected identification documents to backend
      const labelToDocType: Record<string, string> = {
        'Photo': 'photo',
        'Signature': 'signature',
        'Aadhaar (Front)': 'aadhaar_front',
        'Aadhaar (Back)': 'aadhaar_back',
        'Passport (Front)': 'passport_front',
        'Passport (Back)': 'passport_back',
        'UAE ID / PAN (Front)': 'uae_id_front',
        'UAE ID / PAN (Back)': 'uae_id_back',
        'UAE ID / PAN': 'uae_id'
      };

      const docEntries = Object.entries(docFiles);
      if (docEntries.length > 0) {
        for (const [label, file] of docEntries) {
          try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('doc_type', labelToDocType[label] || 'photo');
            await api.post(`/cif/${partyId}/documents`, formDataUpload, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          } catch (uploadErr) {
            console.error(`Failed to upload ${label}:`, uploadErr);
          }
        }
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setValidationError('Failed to provision CIF: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOk = () => {
    setIsSubmitted(false);
    setActiveTab('Basic Info');
    setCifId('');
    setStep('selection');
    setValidationError('');
    setDocuments({});
    setDocFiles({});
    setFormData({ 
      title: '', firstName: '', lastName: '', shortName: '', gender: '', 
      nationality: 'India', contactNo: '', ccy: 'INR', branchOffice: 'INDIA', cifType: 'Customer',
      uaeNo: '', email: '', indianNo: '', whatsappNo: '', otherNumber1: '', relationship1: '', otherNumber2: '', relationship2: '',
      addressFormat: 'Structured', addressType: 'PERMANENT', houseNo: '', premiseName: '', buildingLevel: '', streetNo: '', suburb: '', streetName: '', locality: '', town: '', city: '', state: '', country: 'India', postalCode: '', validFrom: '', validTill: '', addressProofReceived: 'Yes', holdMail: 'N', holdMailBy: '', businessCenter: '', reason: ''
    });
  };

  const handleGo = () => {
    if (selectedFunction) {
      setValidationError('');
      setStep('form');
    } else {
      setValidationError('Please select a valid initiation function to proceed.');
    }
  };

  const handleClear = () => {
    setSelectedFunction('A-ADD');
    setInputCifId('');
    setValidationError('');
  };

  const tabs = [
    { id: 'Basic Info', label: 'Basic Info', icon: <User className="w-4 h-4" /> },
    { id: 'Contact Info', label: 'Contact Info', icon: <Phone className="w-4 h-4" /> },
    { id: 'Identification Document', label: 'Identification Document', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'Address Details', label: 'Address Details', icon: <MapPin className="w-4 h-4" /> }
  ];

  /* -------------------------------------------------------------------------- */
  /* STEP 1: FUNCTION SELECTION CONSOLE (LARGE & SPACIOUS)                      */
  /* -------------------------------------------------------------------------- */
  if (step === 'selection') {
    return (
      <div className="flex-1 flex flex-col bg-[#f0f4f8] overflow-hidden select-none">
        {/* Command Bar Header */}
        <div className="bg-[#104080] text-white px-5 py-2.5 flex items-center justify-between border-b border-[#0a2850] shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-amber-300" />
            <span className="font-bold tracking-wider text-sm uppercase font-sans">
              RETAIL CIF ONBOARDING DESK (CCIF)
            </span>
            <span className="bg-blue-950/80 text-blue-200 border border-blue-600 px-2.5 py-0.5 rounded text-xs font-mono font-bold tracking-wide">
              FUNCTION SELECTION
            </span>
          </div>
          <div className="text-xs text-blue-100 font-medium">
            Infosys Finacle Core Banking
          </div>
        </div>

        {/* Sub-bar / Ribbon */}
        <div className="bg-[#e6edf8] border-b border-[#c4d4ec] px-5 py-2.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 text-[#104080] font-bold text-sm">
            <Building2 className="w-4 h-4" />
            <span>Retail Customer Information File Maintenance (CRM-CIF)</span>
          </div>
          <span className="text-xs text-slate-700 bg-white px-3 py-1 rounded border border-[#c4d4ec] font-semibold">
            Direct Scheme Provisioning
          </span>
        </div>

        {/* Content Panel */}
        <div className="flex-1 p-8 overflow-auto flex items-start justify-center">
          <div className="w-full max-w-3xl bg-white border border-[#c4d4ec] rounded-md shadow-xs overflow-hidden mt-2">
            <div className="bg-[#104080] text-white px-6 py-3 font-bold text-sm flex items-center justify-between">
              <span>Customer Onboarding Initiation Criteria</span>
              <span className="text-xs font-mono text-amber-300 font-normal">FORM: CRM_RETAIL_CIF_01</span>
            </div>

            <div className="p-8 flex flex-col gap-6">
              {validationError && (
                <div className="bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 rounded-md text-sm flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="grid grid-cols-[160px_1fr] items-center gap-y-5 text-sm">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Function</span>
                  <span className="text-red-600 font-bold">*</span>
                </div>
                <div>
                  <select 
                    value={selectedFunction}
                    onChange={(e) => {
                      setSelectedFunction(e.target.value);
                      setValidationError('');
                    }}
                    className="w-full max-w-md h-10 border border-[#a2b5cd] bg-white text-slate-900 rounded-md px-3 text-sm font-semibold focus:outline-none focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 shadow-2xs"
                  >
                    <option value="A-ADD">A - ADD (Create New Retail Customer)</option>
                    <option value="M-MODIFY">M - MODIFY (Update Existing CIF)</option>
                    <option value="V-VERIFY">V - VERIFY (Authorization Desk)</option>
                    <option value="X-CANCEL">X - CANCEL (Discard Pending CIF)</option>
                    <option value="R-REJECT">R - REJECT (Compliance Rejection)</option>
                  </select>
                </div>

                <div className="font-bold text-slate-800">
                  CIF ID
                </div>
                <div>
                  <input 
                    type="text" 
                    value={inputCifId}
                    onChange={(e) => setInputCifId(e.target.value)}
                    placeholder="Auto-generated upon submission"
                    disabled={selectedFunction === 'A-ADD'}
                    className={`w-full max-w-md h-10 border border-[#a2b5cd] rounded-md px-3 text-sm ${
                      selectedFunction === 'A-ADD' 
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed italic font-medium' 
                        : 'bg-white text-slate-900 focus:outline-none focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20'
                    }`} 
                  />
                  {selectedFunction === 'A-ADD' && (
                    <span className="block text-xs text-slate-500 mt-1.5">
                      System will allocate a new 10-digit primary CIF identifier upon submission.
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-6 border-t border-slate-200 mt-2">
                <button 
                  onClick={handleGo}
                  className="bg-[#104080] hover:bg-[#0a2850] text-white px-7 py-2.5 rounded-md text-sm font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span>Go to Onboarding Form</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleClear}
                  className="bg-white hover:bg-slate-100 text-[#104080] border border-[#a2b5cd] px-5 py-2.5 rounded-md text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* STEP 2: MULTI-TAB RETAIL CIF ONBOARDING FORM (EXPANDED TO LARGE & CLEAR)   */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="flex-1 flex flex-col bg-[#f0f4f8] overflow-hidden select-none">
      
      {/* 1. Finacle Command Bar Header */}
      <div className="bg-[#104080] text-white px-5 py-2 flex items-center justify-between border-b border-[#0a2850] shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <UserPlus className="w-5 h-5 text-amber-300" />
          <span className="font-bold tracking-wider text-sm uppercase font-sans">
            RETAIL CUSTOMER CREATION (CCIF / CRM)
          </span>
          <span className="bg-blue-950/80 text-blue-200 border border-blue-600 px-2.5 py-0.5 rounded text-xs font-mono font-bold tracking-wide">
            FUNCTION: {selectedFunction}
          </span>
          <span className="bg-emerald-950/80 text-emerald-200 border border-emerald-600 px-2.5 py-0.5 rounded text-xs font-mono font-bold">
            STAGE: INITIAL REGISTRATION
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep('selection')}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Change Function
          </button>
        </div>
      </div>

      {/* 2. Selection Summary Ribbon */}
      <div className="bg-[#e6edf8] border-b border-[#c4d4ec] px-5 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#104080]">Initiation:</span>
            <span className="bg-white px-2.5 py-0.5 rounded border border-[#c4d4ec] font-semibold text-slate-800 text-xs">
              {selectedFunction === 'A-ADD' ? 'A-ADD (New Retail CIF)' : selectedFunction}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#104080]">CIF ID:</span>
            <span className="bg-white px-2.5 py-0.5 rounded border border-[#c4d4ec] font-mono text-slate-700 text-xs font-medium">
              {inputCifId || 'Auto-Allocated on Submit'}
            </span>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
          <span>Active Section:</span>
          <span className="font-bold text-[#104080] bg-white px-3 py-0.5 rounded border border-[#c4d4ec]">
            {activeTab}
          </span>
        </div>
      </div>

      {/* 3. Validation Banner */}
      {validationError && (
        <div className="bg-amber-50 border-b border-amber-300 text-amber-900 px-5 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 font-semibold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{validationError}</span>
          </div>
          <button 
            onClick={() => setValidationError('')}
            className="text-amber-800 hover:text-black font-bold text-sm cursor-pointer px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4. Tab Navigation Ribbon (Large, easy-to-click) */}
      <div className="bg-[#dbe4f0] border-b border-[#b8cadf] px-5 pt-2.5 flex items-center gap-1.5 shrink-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setValidationError('');
              }}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-t-md transition-all cursor-pointer border-t border-l border-r ${
                isActive
                  ? 'bg-white text-[#104080] border-[#b8cadf] shadow-xs translate-y-[1px] pb-3'
                  : 'bg-[#cfdbe9] text-slate-700 border-transparent hover:bg-[#e4edf7]'
              }`}
            >
              <span className={isActive ? 'text-[#104080]' : 'text-slate-500'}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.id === 'Identification Document' && Object.keys(documents).length > 0 && (
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded font-mono font-bold">
                  {Object.keys(documents).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 5. Tab Content Container */}
      <div className="flex-1 bg-white p-6 overflow-auto flex flex-col">
        <div className="text-[#104080] font-bold text-sm uppercase tracking-wide border-b border-slate-200 pb-2.5 mb-5 flex items-center justify-between">
          <span className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#104080]"></span>
            {activeTab} Section Details
          </span>
          <span className="text-xs text-slate-500 font-normal">
            Fields marked with <span className="text-red-500 font-bold">*</span> are mandatory for CIF validation.
          </span>
        </div>

        <div className="flex-1">
          {/* TAB 1: BASIC INFO (EXPANDED) */}
          {activeTab === 'Basic Info' && (
            <div className="w-full max-w-6xl bg-[#f8fafc] border border-[#c4d4ec] rounded-md p-6 shadow-2xs">
              <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                <div className="flex items-center">
                  <span className="w-44 font-bold text-slate-700 text-sm shrink-0">
                    Title <span className="text-red-600 font-bold">*</span>
                  </span>
                  <select 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    className="flex-1 h-10 border border-[#c4d4ec] bg-white rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none"
                  >
                    <option value="">-- Select Title --</option>
                    <option value="Mr">Mr.</option>
                    <option value="Mrs">Mrs.</option>
                    <option value="Ms">Ms.</option>
                    <option value="Dr">Dr.</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <span className="w-44 font-bold text-slate-700 text-sm shrink-0">
                    First Name <span className="text-red-600 font-bold">*</span>
                  </span>
                  <input 
                    type="text" 
                    value={formData.firstName} 
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                    placeholder="Legal First Name"
                    className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white" 
                  />
                </div>

                <div className="flex items-center">
                  <span className="w-44 font-bold text-slate-700 text-sm shrink-0">
                    Last Name <span className="text-red-600 font-bold">*</span>
                  </span>
                  <input 
                    type="text" 
                    value={formData.lastName} 
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                    placeholder="Legal Surname"
                    className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white" 
                  />
                </div>

                <div className="flex items-center">
                  <span className="w-44 font-bold text-slate-700 text-sm shrink-0">
                    Short Name <span className="text-red-600 font-bold">*</span>
                  </span>
                  <input 
                    type="text" 
                    value={formData.shortName} 
                    onChange={(e) => setFormData({...formData, shortName: e.target.value})} 
                    placeholder="System Display Alias"
                    className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white" 
                  />
                </div>

                <div className="flex items-center">
                  <span className="w-44 font-bold text-slate-700 text-sm shrink-0">
                    Gender <span className="text-red-600 font-bold">*</span>
                  </span>
                  <select 
                    value={formData.gender} 
                    onChange={(e) => setFormData({...formData, gender: e.target.value})} 
                    className="flex-1 h-10 border border-[#c4d4ec] bg-white rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none"
                  >
                    <option value="">-- Select Gender --</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <span className="w-44 font-bold text-slate-700 text-sm shrink-0">
                    Nationality <span className="text-red-600 font-bold">*</span>
                  </span>
                  <select 
                    value={formData.nationality} 
                    onChange={(e) => setFormData({...formData, nationality: e.target.value})} 
                    className="flex-1 h-10 border border-[#c4d4ec] bg-white rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none"
                  >
                    <option value="India">India</option>
                    <option value="UAE">United Arab Emirates</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <span className="w-44 font-bold text-slate-700 text-sm shrink-0">
                    Contact No <span className="text-red-600 font-bold">*</span>
                  </span>
                  <input 
                    type="text" 
                    value={formData.contactNo} 
                    onChange={(e) => setFormData({...formData, contactNo: e.target.value})} 
                    placeholder="+91 / +971 Primary Contact"
                    className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white font-mono" 
                  />
                </div>

                <div className="flex items-center">
                  <span className="w-44 font-bold text-slate-700 text-sm shrink-0">
                    CCY (Currency) <span className="text-red-600 font-bold">*</span>
                  </span>
                  <select 
                    value={formData.ccy} 
                    onChange={(e) => setFormData({...formData, ccy: e.target.value})} 
                    className="flex-1 h-10 border border-[#c4d4ec] bg-white rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none font-bold text-[#104080]"
                  >
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="USD">USD - US Dollar</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <span className="w-44 font-bold text-slate-700 text-sm shrink-0">
                    Branch Office <span className="text-red-600 font-bold">*</span>
                  </span>
                  <select 
                    value={formData.branchOffice} 
                    onChange={(e) => setFormData({...formData, branchOffice: e.target.value})} 
                    className="flex-1 h-10 border border-[#c4d4ec] bg-white rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none font-medium"
                  >
                    <option value="INDIA">INDIA - Clearing Division (Branch 2)</option>
                    <option value="UAE">UAE - Dubai Hub (Branch 1)</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <span className="w-44 font-bold text-slate-700 text-sm shrink-0">
                    CIF Type <span className="text-red-600 font-bold">*</span>
                  </span>
                  <select 
                    value={formData.cifType} 
                    onChange={(e) => setFormData({...formData, cifType: e.target.value})} 
                    className="flex-1 h-10 border border-[#c4d4ec] bg-white rounded-md px-3 text-sm font-semibold focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none"
                  >
                    {cifTypesList.length > 0 ? (
                      cifTypesList.map(t => (
                        <option key={t.id} value={t.name.charAt(0).toUpperCase() + t.name.slice(1).toLowerCase()}>
                          {t.name.charAt(0).toUpperCase() + t.name.slice(1).toLowerCase()}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Customer">Customer</option>
                        <option value="Agent">Agent</option>
                        <option value="Servicer">Servicer</option>
                        <option value="Payment Distributer">Payment Distributer</option>
                        <option value="Employee">Employee</option>
                        <option value="Supplier">Supplier</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTACT INFO (EXPANDED) */}
          {activeTab === 'Contact Info' && (
            <div className="w-full max-w-6xl bg-[#f8fafc] border border-[#c4d4ec] rounded-md p-6 shadow-2xs">
              <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                <div className="flex items-center">
                  <span className="w-44 font-bold text-slate-700 text-sm shrink-0">UAE Phone No</span>
                  <input 
                    type="text" 
                    value={formData.uaeNo} 
                    onChange={(e) => setFormData({...formData, uaeNo: e.target.value})} 
                    placeholder="+971-5X-XXXXXXX"
                    className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white font-mono" 
                  />
                </div>

                <div className="flex items-center">
                  <span className="w-44 font-bold text-slate-700 text-sm shrink-0">Email Address</span>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    placeholder="customer@domain.com"
                    className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white" 
                  />
                </div>

                <div className="flex items-center">
                  <span className="w-44 font-bold text-slate-700 text-sm shrink-0">Indian Phone No</span>
                  <input 
                    type="text" 
                    value={formData.indianNo} 
                    onChange={(e) => setFormData({...formData, indianNo: e.target.value})} 
                    placeholder="+91-XXXXX-XXXXX"
                    className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white font-mono" 
                  />
                </div>

                <div className="flex items-center">
                  <span className="w-44 font-bold text-slate-700 text-sm shrink-0">WhatsApp No</span>
                  <input 
                    type="text" 
                    value={formData.whatsappNo} 
                    onChange={(e) => setFormData({...formData, whatsappNo: e.target.value})} 
                    placeholder="WhatsApp Direct Number"
                    className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white font-mono" 
                  />
                </div>

                <div className="col-span-2 border-b border-slate-200 my-2 pt-3">
                  <span className="text-xs font-bold text-[#104080] uppercase tracking-wide">
                    Alternative & Emergency Contacts
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="w-44 font-bold text-slate-700 text-sm shrink-0">Other Number 1</span>
                  <input 
                    type="text" 
                    value={formData.otherNumber1}
                    onChange={(e) => setFormData({...formData, otherNumber1: e.target.value})}
                    placeholder="Alternate Phone 1"
                    className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white font-mono" 
                  />
                </div>

                <div className="flex items-center">
                  <span className="w-44 font-bold text-slate-700 text-sm shrink-0">Relationship 1</span>
                  <select 
                    value={formData.relationship1}
                    onChange={(e) => setFormData({...formData, relationship1: e.target.value})}
                    className="flex-1 h-10 border border-[#c4d4ec] bg-white rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none"
                  >
                    <option value="">-- Select Relationship --</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Associate">Business Associate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <span className="w-44 font-bold text-slate-700 text-sm shrink-0">Other Number 2</span>
                  <input 
                    type="text" 
                    value={formData.otherNumber2}
                    onChange={(e) => setFormData({...formData, otherNumber2: e.target.value})}
                    placeholder="Alternate Phone 2"
                    className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white font-mono" 
                  />
                </div>

                <div className="flex items-center">
                  <span className="w-44 font-bold text-slate-700 text-sm shrink-0">Relationship 2</span>
                  <select 
                    value={formData.relationship2}
                    onChange={(e) => setFormData({...formData, relationship2: e.target.value})}
                    className="flex-1 h-10 border border-[#c4d4ec] bg-white rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none"
                  >
                    <option value="">-- Select Relationship --</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Associate">Business Associate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IDENTIFICATION DOCUMENT VAULT & INSPECTION CANVAS */}
          {activeTab === 'Identification Document' && (() => {
            const docItems = [
              { label: 'Photo', type: 'photo', short: 'Photo' },
              { label: 'Signature', type: 'signature', short: 'Sign' },
              { label: 'Aadhaar (Front)', type: 'aadhaar', short: 'Aadhaar (F)' },
              { label: 'Aadhaar (Back)', type: 'aadhaar', short: 'Aadhaar (B)' },
              { label: 'Passport (Front)', type: 'passport', short: 'Passport (F)' },
              { label: 'Passport (Back)', type: 'passport', short: 'Passport (B)' },
              { label: 'UAE ID / PAN (Front)', type: 'id', short: 'ID/PAN (F)' },
              { label: 'UAE ID / PAN (Back)', type: 'id', short: 'ID/PAN (B)' }
            ];

            const activeLabel = (selectedPreviewLabel && documents[selectedPreviewLabel])
              ? selectedPreviewLabel
              : (Object.keys(documents)[0] || null);
            const activeDocUrl = activeLabel ? documents[activeLabel] : null;
            const activeFile = activeLabel ? docFiles[activeLabel] : null;
            const isPdf = activeFile ? (activeFile.type === 'application/pdf' || activeFile.name.toLowerCase().endsWith('.pdf')) : false;

            const renderDocIcon = (type: string) => {
              if (type === 'photo') return <User className="w-4 h-4 text-[#104080]" />;
              if (type === 'signature') return <FileText className="w-4 h-4 text-[#104080]" />;
              return <ShieldCheck className="w-4 h-4 text-[#104080]" />;
            };

            return (
              <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
                {/* Left Column: KYC Document Vault Cards (Expanded) */}
                <div className="w-full lg:w-[540px] xl:w-[600px] flex-shrink-0 flex flex-col gap-3">
                  <div className="bg-[#f0f4f8] border border-[#c4d4ec] rounded-md p-4 flex flex-col gap-3 shadow-xs">
                    <div className="font-bold text-[#104080] border-b border-[#c4d4ec] pb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <ShieldCheck className="w-5 h-5 text-[#104080]" />
                        <span>Identification Document Vault</span>
                      </div>
                      <span className="text-xs text-[#104080] font-semibold bg-[#e6edf8] px-2.5 py-1 rounded border border-[#c4d4ec]">
                        {Object.keys(documents).length} / 8 Uploaded
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {docItems.map(({ label, type }, idx) => {
                        const hasDoc = Boolean(documents[label]);
                        const isSelected = activeLabel === label;
                        const curFile = docFiles[label];
                        const curIsPdf = curFile ? (curFile.type === 'application/pdf' || curFile.name.toLowerCase().endsWith('.pdf')) : false;

                        return (
                          <div key={idx} className="flex flex-col gap-1">
                            {/* Card Header Label */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-[#104080]">
                                {renderDocIcon(type)}
                                <span className="truncate">{label}</span>
                              </div>
                              {hasDoc && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                                  isSelected 
                                    ? 'bg-[#104080] text-white border-[#104080]' 
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                }`}>
                                  {isSelected ? 'Viewing' : <><Check className="w-3 h-3 stroke-[2.5]" /> Ready</>}
                                </span>
                              )}
                            </div>

                            {/* Card Body / Interactive Zone */}
                            <div 
                              onClick={() => {
                                if (hasDoc) {
                                  setSelectedPreviewLabel(label);
                                  setPreviewZoom(1);
                                  setPreviewRotation(0);
                                }
                              }}
                              className={`border rounded-md p-2.5 flex flex-col gap-2 transition-all ${
                                isSelected 
                                  ? 'border-[#104080] bg-[#e6edf8] shadow-xs' 
                                  : hasDoc 
                                    ? 'border-emerald-300 bg-white hover:border-[#104080] cursor-pointer' 
                                    : 'border-dashed border-slate-300 bg-white hover:border-[#104080]'
                              }`}
                            >
                              {/* Thumbnail preview if uploaded */}
                              {hasDoc ? (
                                <div className="flex items-center gap-2.5">
                                  <div className="w-12 h-12 rounded border border-[#c4d4ec] bg-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs">
                                    {curIsPdf ? (
                                      <div className="flex flex-col items-center justify-center text-red-600 font-bold text-[9px]">
                                        <span>PDF</span>
                                      </div>
                                    ) : (
                                      <img 
                                        src={documents[label]} 
                                        alt={label} 
                                        className="w-full h-full object-cover" 
                                      />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-slate-800 truncate">
                                      {curFile?.name || 'Uploaded Document'}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      {curFile ? `${Math.round(curFile.size / 1024)} KB` : 'Ready for verification'}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-slate-400 italic py-1.5 flex items-center gap-1">
                                  <span>No document uploaded</span>
                                </div>
                              )}

                              {/* Action Row */}
                              <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100">
                                <label className="flex-1 bg-white hover:bg-slate-50 text-[#104080] border border-[#a2b5cd] px-2 py-1 rounded text-xs font-semibold text-center cursor-pointer transition-colors shadow-2xs">
                                  <span>{hasDoc ? 'Replace' : 'Upload'}</span>
                                  <input 
                                    type="file" 
                                    onChange={(e) => handleFileUpload(label, e)} 
                                    accept="image/*,application/pdf" 
                                    className="hidden" 
                                  />
                                </label>

                                {hasDoc && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPreviewLabel(label);
                                        setPreviewZoom(1);
                                        setPreviewRotation(0);
                                      }}
                                      className="bg-[#104080] hover:bg-[#0a2850] text-white px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                      Inspect
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewDoc({
                                          url: documents[label],
                                          label,
                                          isPdf: curIsPdf
                                        });
                                      }}
                                      className="p-1.5 text-slate-600 hover:text-black hover:bg-slate-100 rounded cursor-pointer"
                                      title="Open Fullscreen Modal"
                                    >
                                      <Maximize2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column: High-Res KYC Inspector Canvas (Expanded) */}
                <div className="flex-1 w-full bg-white border border-[#c4d4ec] rounded-md flex flex-col min-h-[580px] shadow-xs overflow-hidden">
                  {/* Canvas Toolbar */}
                  <div className="bg-[#104080] text-white px-4 py-2.5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-amber-300" />
                      <span className="font-bold text-sm uppercase tracking-wide">
                        {activeLabel ? `Inspecting: ${activeLabel}` : 'KYC Document Inspector'}
                      </span>
                    </div>

                    {activeDocUrl && (
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setPreviewZoom(z => Math.max(0.5, z - 0.25))}
                          className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded text-xs font-bold cursor-pointer"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="bg-black/30 px-2.5 py-0.5 rounded text-xs font-mono font-bold">
                          {Math.round(previewZoom * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => setPreviewZoom(z => Math.min(3, z + 0.25))}
                          className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded text-xs font-bold cursor-pointer"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewRotation(r => (r + 90) % 360)}
                          className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded text-xs font-bold cursor-pointer flex items-center gap-1"
                          title="Rotate 90° Clockwise"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>90°</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewZoom(1);
                            setPreviewRotation(0);
                          }}
                          className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer"
                          title="Reset View"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewDoc({ url: activeDocUrl, label: activeLabel || 'Document', isPdf })}
                          className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-3 py-1 rounded text-xs font-bold cursor-pointer flex items-center gap-1"
                          title="Pop-out Fullscreen Modal"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Popout Modal</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Canvas Viewport */}
                  <div className="flex-1 bg-[#232323] p-6 flex items-center justify-center overflow-auto relative min-h-[500px]">
                    {activeDocUrl ? (
                      isPdf ? (
                        <div className="w-full h-full min-h-[500px] bg-white rounded-md shadow-md overflow-hidden">
                          <iframe 
                            src={activeDocUrl} 
                            title={activeLabel || 'PDF Preview'} 
                            className="w-full h-full min-h-[500px] border-none"
                          />
                        </div>
                      ) : (
                        <div 
                          className="transition-transform duration-200 ease-out origin-center flex items-center justify-center"
                          style={{
                            transform: `scale(${previewZoom}) rotate(${previewRotation}deg)`
                          }}
                        >
                          <img 
                            src={activeDocUrl} 
                            alt={activeLabel || 'Preview'} 
                            className="max-w-[92%] max-h-[520px] object-contain rounded-md shadow-2xl bg-white"
                          />
                        </div>
                      )
                    ) : (
                      <div className="text-center text-slate-400 p-8 flex flex-col items-center">
                        <FileText className="w-14 h-14 text-slate-600 mb-3 stroke-[1.5]" />
                        <span className="font-bold text-slate-200 text-sm mb-1 uppercase tracking-wide">
                          Document Canvas Idle
                        </span>
                        <p className="text-xs text-slate-400 max-w-sm mb-4">
                          Select any uploaded document from the left vault or upload a new identity record to inspect details and validity.
                        </p>
                        <div className="text-xs text-slate-400 bg-slate-800/80 px-3.5 py-1.5 rounded border border-slate-700">
                          Supports JPG, PNG, WEBP and PDF documents
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Metadata bar */}
                  {activeDocUrl && (
                    <div className="bg-[#e6edf8] border-t border-[#c4d4ec] px-5 py-2 text-xs text-slate-700 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-4">
                        <span>Active Record: <b className="text-[#104080]">{activeLabel}</b></span>
                        <span className="text-slate-300">|</span>
                        <span className="truncate max-w-[320px]">File: {activeFile?.name || 'Uploaded File'}</span>
                        {activeFile && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span>Size: {Math.round(activeFile.size / 1024)} KB</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Ready for Verification</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB 4: ADDRESS DETAILS (EXPANDED) */}
          {activeTab === 'Address Details' && (
            <div className="flex flex-col gap-5 w-full max-w-6xl">
              <div className="border border-[#c4d4ec] bg-[#f8fafc] rounded-md p-6 shadow-2xs">
                <div className="bg-[#e6edf8] px-4 py-2 font-bold text-[#104080] border border-[#c4d4ec] rounded-md mb-4 flex items-center justify-between text-sm">
                  <span>Residential & Mailing Address Profile</span>
                  <span className="text-xs text-slate-600 font-normal">Structured Core Format</span>
                </div>

                <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                  <div className="flex items-center">
                    <span className="w-44 font-bold text-slate-700 text-sm shrink-0">Address Format</span>
                    <select 
                      value={formData.addressFormat}
                      onChange={(e) => setFormData({...formData, addressFormat: e.target.value})}
                      className="flex-1 h-10 border border-[#c4d4ec] bg-white rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none"
                    >
                      <option value="Structured">Structured</option>
                      <option value="Free Text">Free Text</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <span className="w-44 font-bold text-slate-700 text-sm shrink-0">Address Type</span>
                    <select 
                      value={formData.addressType}
                      onChange={(e) => setFormData({...formData, addressType: e.target.value})}
                      className="flex-1 h-10 border border-[#c4d4ec] bg-white rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none"
                    >
                      <option value="PERMANENT">PERMANENT</option>
                      <option value="MAILING">MAILING</option>
                      <option value="BUSINESS">BUSINESS</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="w-44 font-bold text-slate-700 text-sm shrink-0">House / Flat No</span>
                    <input 
                      type="text" 
                      value={formData.houseNo}
                      onChange={(e) => setFormData({...formData, houseNo: e.target.value})}
                      placeholder="e.g. Flat 402, Villa 12"
                      className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white" 
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="w-44 font-bold text-slate-700 text-sm shrink-0">Premise Name</span>
                    <input 
                      type="text" 
                      value={formData.premiseName}
                      onChange={(e) => setFormData({...formData, premiseName: e.target.value})}
                      placeholder="e.g. Al-Fajr Tower, Sunshine Residency"
                      className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white" 
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="w-44 font-bold text-slate-700 text-sm shrink-0">Building Level</span>
                    <input 
                      type="text" 
                      value={formData.buildingLevel}
                      onChange={(e) => setFormData({...formData, buildingLevel: e.target.value})}
                      placeholder="e.g. Floor 4, Block B"
                      className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white" 
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="w-44 font-bold text-slate-700 text-sm shrink-0">Street No</span>
                    <input 
                      type="text" 
                      value={formData.streetNo}
                      onChange={(e) => setFormData({...formData, streetNo: e.target.value})}
                      placeholder="e.g. Street 14"
                      className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white" 
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="w-44 font-bold text-slate-700 text-sm shrink-0">Street Name</span>
                    <input 
                      type="text" 
                      value={formData.streetName}
                      onChange={(e) => setFormData({...formData, streetName: e.target.value})}
                      placeholder="e.g. Sheikh Zayed Road, MG Road"
                      className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white" 
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="w-44 font-bold text-slate-700 text-sm shrink-0">Suburb / Sector</span>
                    <input 
                      type="text" 
                      value={formData.suburb}
                      onChange={(e) => setFormData({...formData, suburb: e.target.value})}
                      placeholder="e.g. Downtown, Bandra West"
                      className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white" 
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="w-44 font-bold text-slate-700 text-sm shrink-0">Locality</span>
                    <input 
                      type="text" 
                      value={formData.locality}
                      onChange={(e) => setFormData({...formData, locality: e.target.value})}
                      placeholder="e.g. Landmark or Area"
                      className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white" 
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="w-44 font-bold text-slate-700 text-sm shrink-0">Town</span>
                    <input 
                      type="text" 
                      value={formData.town}
                      onChange={(e) => setFormData({...formData, town: e.target.value})}
                      placeholder="e.g. Town Name"
                      className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white" 
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="w-44 font-bold text-slate-700 text-sm shrink-0">
                      City <span className="text-red-600 font-bold">*</span>
                    </span>
                    <input 
                      type="text" 
                      value={formData.city} 
                      onChange={(e) => setFormData({...formData, city: e.target.value})} 
                      placeholder="e.g. Mumbai, Dubai"
                      className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white" 
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="w-44 font-bold text-slate-700 text-sm shrink-0">State / Province</span>
                    <input 
                      type="text" 
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      placeholder="e.g. Maharashtra, Dubai"
                      className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white" 
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="w-44 font-bold text-slate-700 text-sm shrink-0">
                      Country <span className="text-red-600 font-bold">*</span>
                    </span>
                    <input 
                      type="text" 
                      value={formData.country} 
                      onChange={(e) => setFormData({...formData, country: e.target.value})} 
                      placeholder="e.g. India, UAE"
                      className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white" 
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="w-44 font-bold text-slate-700 text-sm shrink-0">Postal Code / PIN</span>
                    <input 
                      type="text" 
                      value={formData.postalCode}
                      onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                      placeholder="e.g. 400001, 00000"
                      className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none bg-white font-mono" 
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="w-44 font-bold text-slate-700 text-sm shrink-0">Address Valid From</span>
                    <FinacleDatePicker 
                      value={formData.validFrom} 
                      onChange={(e) => setFormData({...formData, validFrom: e.target.value})} 
                      className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm bg-white focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20" 
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="w-44 font-bold text-slate-700 text-sm shrink-0">Address Valid Till</span>
                    <FinacleDatePicker 
                      value={formData.validTill} 
                      onChange={(e) => setFormData({...formData, validTill: e.target.value})} 
                      className="flex-1 h-10 border border-[#c4d4ec] rounded-md px-3 text-sm bg-white focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20" 
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="w-44 font-bold text-slate-700 text-sm shrink-0">Address Proof Verified</span>
                    <select 
                      value={formData.addressProofReceived}
                      onChange={(e) => setFormData({...formData, addressProofReceived: e.target.value})}
                      className="flex-1 h-10 border border-[#c4d4ec] bg-white rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none font-medium"
                    >
                      <option value="Yes">Yes - Valid KYC Attached</option>
                      <option value="No">No - Pending Documentation</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <span className="w-44 font-bold text-slate-700 text-sm shrink-0">Hold Mail Indicator</span>
                    <select 
                      value={formData.holdMail}
                      onChange={(e) => setFormData({...formData, holdMail: e.target.value})}
                      className="flex-1 h-10 border border-[#c4d4ec] bg-white rounded-md px-3 text-sm focus:border-[#104080] focus:ring-2 focus:ring-[#104080]/20 focus:outline-none font-medium"
                    >
                      <option value="N">N - Deliver Mail to Address</option>
                      <option value="Y">Y - Hold Mail at Branch</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions Footer Bar (Large & Prominent) */}
        {(() => {
          const tabIds = tabs.map(t => t.id);
          const currentTabIndex = tabIds.indexOf(activeTab);
          const isFirstTab = currentTabIndex === 0;
          const isLastTab = currentTabIndex === tabIds.length - 1;

          const handleBack = () => {
            if (!isFirstTab) {
              setActiveTab(tabIds[currentTabIndex - 1]);
              setValidationError('');
            }
          };

          const handleNext = () => {
            if (!isLastTab) {
              setActiveTab(tabIds[currentTabIndex + 1]);
              setValidationError('');
            }
          };

          return (
            <div className="mt-8 flex flex-wrap items-center justify-between border-t border-[#c4d4ec] pt-4 bg-[#f8fafc] -mx-6 -mb-6 px-6 py-4 shrink-0">
              <div className="flex items-center gap-3">
                {/* Back Button */}
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isFirstTab}
                  className={`px-5 py-2.5 rounded-md text-sm font-semibold flex items-center gap-2 transition-all ${
                    isFirstTab 
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                      : 'bg-white hover:bg-slate-100 text-[#104080] border border-[#a2b5cd] cursor-pointer shadow-xs'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isLastTab}
                  className={`px-6 py-2.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${
                    isLastTab 
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                      : 'bg-white hover:bg-blue-50 text-[#104080] border border-[#104080] cursor-pointer shadow-xs'
                  }`}
                >
                  <span>Next Tab</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Submit Button */}
                <button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`bg-[#104080] hover:bg-[#0a2850] text-white px-7 py-2.5 rounded-md text-sm font-bold shadow-xs transition-colors flex items-center gap-2 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Provisioning CIF...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Submit Retail CIF</span>
                    </>
                  )}
                </button>

                {/* Close Button */}
                <button 
                  type="button"
                  onClick={() => setStep('selection')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-5 py-2.5 rounded-md text-sm font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Step indicator text on the right */}
              <div className="text-xs text-slate-600 font-semibold flex items-center gap-2">
                <span>Progress:</span>
                <span className="bg-white px-3 py-1 rounded-md border border-[#c4d4ec] text-[#104080] font-bold text-xs">
                  Step {currentTabIndex + 1} of {tabs.length} ({activeTab})
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* -------------------------------------------------------------------------- */}
      {/* CIF CREATION SUCCESS MODAL                                                 */}
      {/* -------------------------------------------------------------------------- */}
      {isSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white border-2 border-[#104080] rounded-lg shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#104080] text-white px-5 py-3 font-bold text-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <span>CIF Provisioning Complete</span>
              </div>
              <span className="text-xs text-amber-300 font-mono">STATUS: RECORD COMMITTED</span>
            </div>

            <div className="p-7 flex flex-col gap-5">
              <div className="flex items-center gap-5 bg-emerald-50 border border-emerald-200 p-5 rounded-lg">
                <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <div>
                  <div className="text-sm text-emerald-950 font-bold mb-1">
                    Retail Customer Information File Created Successfully
                  </div>
                  <div className="flex items-center gap-2.5 mt-1.5">
                    <span className="text-xs text-slate-600 font-semibold">Allocated CIF ID:</span>
                    <span className="bg-white text-[#104080] font-mono text-base font-extrabold px-3 py-1 rounded border border-emerald-300 shadow-2xs">
                      {cifId}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1.5">
                    Customer: <span className="font-bold text-slate-900">{formData.title} {formData.firstName} {formData.lastName}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                The customer record is now registered in the core Finacle repository. You may now proceed to link accounts, issue debit facilities, or perform document verification.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button 
                  onClick={handleOk}
                  className="bg-[#104080] hover:bg-[#0a2850] text-white px-6 py-2.5 rounded-md text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Acknowledge & Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* HIGH-RES FULLSCREEN DOCUMENT PREVIEW MODAL                                */}
      {/* -------------------------------------------------------------------------- */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xs">
          <div className="bg-white border-2 border-[#104080] rounded-lg shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="bg-[#104080] text-white px-5 py-2.5 font-bold text-sm flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-300" />
                <span>KYC Verification Inspector - {previewDoc.label}</span>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)} 
                className="text-white hover:text-red-300 font-bold cursor-pointer p-1"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-[#1a1a1a] flex items-center justify-center p-6 min-h-[480px]">
              {previewDoc.isPdf ? (
                <iframe 
                  src={previewDoc.url} 
                  title={previewDoc.label} 
                  className="w-full h-[620px] border border-slate-600 rounded-md bg-white" 
                />
              ) : (
                <img 
                  src={previewDoc.url} 
                  alt={previewDoc.label} 
                  className="max-w-full max-h-[620px] object-contain rounded-md shadow-lg bg-white" 
                />
              )}
            </div>
            <div className="bg-[#e6edf8] px-5 py-2.5 border-t border-[#c4d4ec] flex items-center justify-between text-xs font-medium">
              <span className="text-slate-800">Document: <b className="text-[#104080] font-bold">{previewDoc.label}</b></span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="bg-[#104080] hover:bg-[#0a2850] text-white px-5 py-1.5 rounded-md text-xs font-bold cursor-pointer shadow-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
