import FinacleDatePicker from './FinacleDatePicker';
import React, { useState, useEffect } from 'react';

import api from '../services/api';

export default function CreateRetailCifForm() {
  const [step, setStep] = useState('selection');
  const [activeTab, setActiveTab] = useState('Basic Info');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cifId, setCifId] = useState('');
  const [selectedFunction, setSelectedFunction] = useState('');
  const [inputCifId, setInputCifId] = useState('');
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [docFiles, setDocFiles] = useState<Record<string, File>>({});
  const [previewDoc, setPreviewDoc] = useState<{url: string, label: string, isPdf?: boolean} | null>(null);
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
    title: '',
    firstName: '',
    lastName: '',
    shortName: '',
    gender: '',
    nationality: '',
    contactNo: '',
    ccy: '',
    branchOffice: '',
    cifType: '',
    uaeNo: '',
    email: '',
    indianNo: '',
    city: '',
    country: ''
  });

  const handleSubmit = async () => {
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
      alert('Please fill in all mandatory fields in the Basic Info tab.');
      return;
    }

    const payload = {
      title: formData.title,
      first_name: formData.firstName,
      last_name: formData.lastName,
      short_name: formData.shortName,
      gender: formData.gender,
      nationality: formData.nationality,
      contact_number: formData.contactNo,
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
        if (val === 'GENERAL') return 5;
        if (val === 'SERVICER') return 6;
        if (val === 'SUPPLIER') return 7;
        return 4;
      })(),
      email: formData.email,
      indian_number: formData.indianNo,
      whatsapp_number: '',
      _profile: {
        contacts: [],
        addresses: [{
          address_format: 'Structured',
          address_type: 'PERMANENT',
          house_no: '',
          street_no: '',
          street_name: '',
          city: formData.city || 'Unknown',
          state: 'Unknown',
          country: formData.country || 'Unknown',
          postal_code: '00000'
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
      alert('Error saving CIF: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOk = () => {
    setIsSubmitted(false);
    setActiveTab('Basic Info');
    setCifId('');
    setStep('selection');
    setDocuments({});
    setDocFiles({});
    setFormData({ 
      title: '', firstName: '', lastName: '', shortName: '', gender: '', 
      nationality: '', contactNo: '', ccy: '', branchOffice: '', cifType: '',
      uaeNo: '', email: '', indianNo: '', city: '', country: '' 
    });
  };

  const handleGo = () => {
    if (selectedFunction) {
      setStep('form');
    } else {
      alert("Please select a function");
    }
  };

  const handleClear = () => {
    setSelectedFunction('');
    setInputCifId('');
  };

  const tabs = ['Basic Info', 'Contact Info', 'Identification Document', 'Address Details'];

  if (step === 'selection') {
    return (
      <div className="flex-1 flex flex-col bg-[#e4e4e4]" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
        <div className="bg-white px-3 py-2.5 border-b border-[#a0a0a0]">
          <h4 className="text-[15px] font-extrabold text-[#1e4676] m-0 capitalize tracking-wide">create retail cif</h4>
        </div>
        <div className="flex-1 bg-white p-4 font-sans">
          <h2 className="text-[16px] font-bold text-black mb-2">Custom Create Retail CIF</h2>
          <div className="border-2 border-[#a0a0a0] p-4 bg-white mb-4 w-full max-w-4xl">
          <div className="grid grid-cols-[150px_1fr] gap-y-4 items-center">
            <div className="font-bold text-[13px] text-black">
              Function <span className="text-red-600">*</span>
            </div>
            <div>
              <select 
                value={selectedFunction}
                onChange={(e) => setSelectedFunction(e.target.value)}
                className="w-[200px] border border-[#7f9db9] bg-[#00a2e8] text-white focus:outline-none h-[22px] text-[12px] px-1"
              >
                <option value="">-- SELECT --</option>
                <option value="A-ADD" className="bg-white text-black">A-ADD</option>
                <option value="M-MODIFY" className="bg-white text-black">M-MODIFY</option>
                <option value="V-VERIFY" className="bg-white text-black">V-VERIFY</option>
                <option value="X-CANCEL" className="bg-white text-black">X-CANCEL</option>
                <option value="R-REJECT" className="bg-white text-black">R-REJECT</option>
              </select>
            </div>

            <div className="font-bold text-[13px] text-black">
              CIF ID
            </div>
            <div>
              <input 
                type="text" 
                value={inputCifId}
                onChange={(e) => setInputCifId(e.target.value)}
                disabled
                className="w-[200px] border border-[#7f9db9] h-[22px] px-1 focus:outline-none text-[12px] bg-gray-100 cursor-not-allowed" 
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleGo}
            className="bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-3 py-1 text-sm text-black"
          >
            Go
          </button>
          <button 
            onClick={handleClear}
            className="bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-3 py-1 text-sm text-black"
          >
            Clear
          </button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#e4e4e4]" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
      
      <div className="bg-white px-3 py-2.5 border-b border-[#a0a0a0]">
        <h4 className="text-[15px] font-extrabold text-[#1e4676] m-0 capitalize tracking-wide mb-3">create retail cif</h4>
        
        {/* Selected Function and CIF ID */}
        <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-2 text-[12px] text-black items-center w-fit">
          <span className="font-bold text-[#1e4676]">Function:</span>
          <span className="bg-white px-2 border border-[#a0a0a0] min-w-[150px] h-[22px] flex items-center shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2)]">{selectedFunction || ''}</span>
          
          <span className="font-bold text-[#1e4676]">CIF ID:</span>
          <span className="bg-white px-2 border border-[#a0a0a0] min-w-[150px] h-[22px] flex items-center shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2)]">{inputCifId || ''}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-2 overflow-auto relative">
        {/* Tabs */}
        <div className="flex border-b border-[#a0a0a0]">
        {tabs.map((tab) => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 cursor-pointer text-[11px] border border-b-0 border-[#a0a0a0] rounded-t-sm select-none ${
              activeTab === tab ? 'bg-white font-bold text-[#104080]' : 'bg-[#d4d0c8] text-black hover:bg-[#eaeaea]'
            }`}
            style={{ marginBottom: '-1px' }}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 bg-white border border-[#a0a0a0] p-4 text-[11px] text-black shadow-sm flex flex-col overflow-auto">
        <div className="text-[#0000ff] font-bold mb-4">{activeTab} Details</div>

        <div className="flex-1">
          {activeTab === 'Basic Info' && (
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 max-w-3xl">
              <div className="flex items-center">
                <span className="w-32 font-semibold">Title <span className="text-red-600">*</span></span>
                <select value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="flex-1 border border-[#7f9db9] bg-white h-[30px] focus:outline-none">
                  <option value=""></option>
                  <option value="Mr">Mr.</option>
                  <option value="Mrs">Mrs.</option>
                </select>
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">First Name <span className="text-red-600">*</span></span>
                <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Last Name <span className="text-red-600">*</span></span>
                <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Short Name <span className="text-red-600">*</span></span>
                <input type="text" value={formData.shortName} onChange={(e) => setFormData({...formData, shortName: e.target.value})} className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Gender <span className="text-red-600">*</span></span>
                <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="flex-1 border border-[#7f9db9] bg-white h-[30px] focus:outline-none">
                  <option value=""></option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Nationality <span className="text-red-600">*</span></span>
                <input type="text" value={formData.nationality} onChange={(e) => setFormData({...formData, nationality: e.target.value})} className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Contact No <span className="text-red-600">*</span></span>
                <input type="text" value={formData.contactNo} onChange={(e) => setFormData({...formData, contactNo: e.target.value})} className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">CCY <span className="text-red-600">*</span></span>
                <select value={formData.ccy} onChange={(e) => setFormData({...formData, ccy: e.target.value})} className="flex-1 border border-[#7f9db9] bg-white h-[30px] focus:outline-none">
                  <option value=""></option>
                  <option value="INR">INR</option>
                  <option value="AED">AED</option>
                </select>
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Branch Office <span className="text-red-600">*</span></span>
                <select value={formData.branchOffice} onChange={(e) => setFormData({...formData, branchOffice: e.target.value})} className="flex-1 border border-[#7f9db9] bg-white h-[30px] focus:outline-none">
                  <option value=""></option>
                  <option value="UAE">UAE</option>
                  <option value="INDIA">INDIA</option>
                </select>
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">CIF Type <span className="text-red-600">*</span></span>
                <select value={formData.cifType} onChange={(e) => setFormData({...formData, cifType: e.target.value})} className="flex-1 border border-[#7f9db9] bg-white h-[30px] focus:outline-none">
                  <option value=""></option>
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
                      <option value="Supplier">Supplier</option>
                      <option value="General">General</option>
                      <option value="Other">Other</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'Contact Info' && (
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 max-w-4xl">
              <div className="flex items-center">
                <span className="w-32 font-semibold">UAE No</span>
                <input type="text" value={formData.uaeNo} onChange={(e) => setFormData({...formData, uaeNo: e.target.value})} className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Email ID</span>
                <input type="text" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Indian No</span>
                <input type="text" value={formData.indianNo} onChange={(e) => setFormData({...formData, indianNo: e.target.value})} className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Whatsapp No</span>
                <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
              </div>
              <div className="col-span-2 border-b border-[#e5e5e5] my-2"></div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Other Number 1</span>
                <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Relationship 1</span>
                <select className="flex-1 border border-[#7f9db9] bg-white h-[30px] focus:outline-none">
                  <option>--Select--</option>
                  <option>Spouse</option>
                  <option>Parent</option>
                  <option>Child</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Other Number 2</span>
                <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Relationship 2</span>
                <select className="flex-1 border border-[#7f9db9] bg-white h-[30px] focus:outline-none">
                  <option>--Select--</option>
                  <option>Spouse</option>
                  <option>Parent</option>
                  <option>Child</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          )}

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
              if (type === 'photo') {
                return (
                  <svg className="w-3.5 h-3.5 text-[#104080]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                );
              }
              if (type === 'signature') {
                return (
                  <svg className="w-3.5 h-3.5 text-[#104080]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                );
              }
              if (type === 'passport') {
                return (
                  <svg className="w-3.5 h-3.5 text-[#104080]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                );
              }
              if (type === 'aadhaar') {
                return (
                  <svg className="w-3.5 h-3.5 text-[#104080]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                );
              }
              return (
                <svg className="w-3.5 h-3.5 text-[#104080]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              );
            };

            return (
              <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
                {/* Left Column: KYC Document Vault Cards */}
                <div className="w-full lg:w-[500px] xl:w-[540px] flex-shrink-0 flex flex-col gap-3">
                  <div className="bg-[#f4f7fc] border border-[#a2b5cd] p-3.5 flex flex-col gap-3 shadow-xs">
                    <div className="font-bold text-[#104080] border-b border-[#a2b5cd] pb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[12px]">
                        <span>Identification Document Vault</span>
                      </div>
                      <span className="text-[10px] text-[#104080] font-semibold bg-[#eaf0f8] px-2 py-0.5 rounded border border-[#a2b5cd]">
                        {Object.keys(documents).length} / 8 Uploaded
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2.5">
                      {docItems.map(({ label, type }, idx) => {
                        const hasDoc = Boolean(documents[label]);
                        const isSelected = activeLabel === label;
                        const curFile = docFiles[label];
                        const curIsPdf = curFile ? (curFile.type === 'application/pdf' || curFile.name.toLowerCase().endsWith('.pdf')) : false;

                        return (
                          <div key={idx} className="flex flex-col gap-1">
                            {/* Card Header Label */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-[11px] font-bold text-[#104080]">
                                {renderDocIcon(type)}
                                <span className="truncate">{label}</span>
                              </div>
                              {hasDoc && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                  isSelected 
                                    ? 'bg-[#104080] text-white border-[#104080]' 
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                }`}>
                                  {isSelected ? 'Viewing' : '✓ Ready'}
                                </span>
                              )}
                            </div>

                            {/* Card Body Slot */}
                            <div 
                              onClick={() => {
                                if (hasDoc) {
                                  setSelectedPreviewLabel(label);
                                  setPreviewZoom(1);
                                  setPreviewRotation(0);
                                }
                              }}
                              className={`flex items-center justify-between border ${
                                isSelected 
                                  ? 'border-[#104080] bg-[#eef4fc] ring-1 ring-[#104080] shadow-xs' 
                                  : hasDoc 
                                    ? 'border-[#a2b5cd] bg-white hover:border-[#316ac5] hover:bg-[#fbfdff] shadow-xs cursor-pointer' 
                                    : 'border-dashed border-[#a2b5cd] bg-white hover:border-[#104080] hover:bg-[#f8faff]'
                              } p-1.5 relative group transition-all rounded-sm h-[52px] overflow-hidden`}
                            >
                              {!hasDoc && (
                                <input 
                                  type="file" 
                                  accept="image/*,.pdf"
                                  onChange={(e) => handleFileUpload(label, e)}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                  title=" " 
                                />
                              )}

                              {hasDoc ? (
                                <div className="flex items-center justify-between w-full h-full z-20">
                                  <div className="flex items-center gap-2 flex-1 min-w-0 pr-1">
                                    {curIsPdf ? (
                                      <div className="w-9 h-9 bg-red-50 border border-red-300 text-red-700 font-extrabold text-[10px] rounded-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                                        PDF
                                      </div>
                                    ) : (
                                      <img 
                                        src={documents[label]} 
                                        alt={label} 
                                        className="w-9 h-9 object-cover rounded-sm border border-gray-300 flex-shrink-0 shadow-xs" 
                                      />
                                    )}
                                    <div className="flex flex-col min-w-0 flex-1 leading-tight">
                                      <span className="text-[#104080] font-bold text-[11px] truncate">
                                        {curFile?.name || 'Document uploaded'}
                                      </span>
                                      <span className="text-[9px] text-gray-500 truncate mt-0.5">
                                        {curFile ? `${Math.round(curFile.size / 1024)} KB` : 'Click to inspect'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setPreviewDoc({ url: documents[label], label, isPdf: curIsPdf });
                                      }}
                                      className="text-[#104080] hover:bg-[#dbe8f9] p-1 text-xs rounded transition-colors cursor-pointer"
                                      title="Open Fullscreen Dialog"
                                    >
                                      ⤢
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDocuments(prev => { const n = {...prev}; delete n[label]; return n; });
                                        setDocFiles(prev => { const n = {...prev}; delete n[label]; return n; });
                                        if (selectedPreviewLabel === label) {
                                          setSelectedPreviewLabel(null);
                                        }
                                      }}
                                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 font-bold p-1 text-xs rounded transition-colors cursor-pointer"
                                      title="Remove document"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between w-full h-full px-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-[#eef4fc] flex items-center justify-center text-[#104080]">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="17 8 12 3 7 8"></polyline>
                                        <line x1="12" y1="3" x2="12" y2="15"></line>
                                      </svg>
                                    </div>
                                    <div className="flex flex-col leading-none">
                                      <span className="text-[#104080] font-semibold text-[10px]">Select file</span>
                                      <span className="text-[8.5px] text-gray-400 mt-0.5">JPG / PNG / PDF</span>
                                    </div>
                                  </div>
                                  <div className="bg-[#f0f4f9] group-hover:bg-[#104080] text-[#104080] group-hover:text-white border border-[#a2b5cd] px-2 py-0.5 font-bold text-[9.5px] rounded-sm transition-colors pointer-events-none shadow-xs">
                                    Browse
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column: Finacle Premium KYC Document Inspector */}
                <div className="flex-1 w-full bg-white border border-[#a2b5cd] flex flex-col shadow-sm min-h-[520px] rounded-sm overflow-hidden">
                  {/* Inspector Header */}
                  <div className="bg-[#eaf0f8] border-b border-[#a2b5cd] px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-[#104080] text-white flex items-center justify-center font-serif text-[10px] font-bold shadow-xs">
                        i
                      </div>
                      <span className="font-extrabold text-[#104080] text-[12px] uppercase tracking-wide">
                        Document Inspector
                      </span>
                      {activeLabel ? (
                        <span className="font-bold text-[#104080] bg-white px-2.5 py-0.5 border border-[#a2b5cd] rounded text-[11px] shadow-xs flex items-center gap-1.5 ml-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          {activeLabel}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px] italic ml-1">No Document Selected</span>
                      )}
                    </div>

                    {/* Toolbar Controls */}
                    {activeDocUrl && (
                      <div className="flex items-center gap-1.5">
                        {!isPdf && (
                          <>
                            <button
                              type="button"
                              onClick={() => setPreviewRotation(r => (r + 90) % 360)}
                              className="bg-white hover:bg-[#eef4fc] text-[#104080] border border-[#a2b5cd] px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                              title="Rotate 90 degrees"
                            >
                              <span>↻</span>
                              <span>Rotate</span>
                            </button>
                            <div className="flex items-center bg-white border border-[#a2b5cd] rounded text-[10px] overflow-hidden shadow-xs">
                              <button
                                type="button"
                                onClick={() => setPreviewZoom(z => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                                className="px-1.5 py-0.5 hover:bg-[#eef4fc] text-[#104080] font-bold border-r border-[#a2b5cd] cursor-pointer"
                                title="Zoom Out"
                              >
                                －
                              </button>
                              <span className="px-2 py-0.5 font-bold text-[#104080] min-w-[42px] text-center bg-[#f8fafc]">
                                {Math.round(previewZoom * 100)}%
                              </span>
                              <button
                                type="button"
                                onClick={() => setPreviewZoom(z => Math.min(3, Number((z + 0.25).toFixed(2))))}
                                className="px-1.5 py-0.5 hover:bg-[#eef4fc] text-[#104080] font-bold border-l border-[#a2b5cd] cursor-pointer"
                                title="Zoom In"
                              >
                                ＋
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setPreviewZoom(1); setPreviewRotation(0); }}
                              className="bg-white hover:bg-[#eef4fc] text-[#104080] border border-[#a2b5cd] px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer shadow-xs"
                              title="Reset Zoom & Rotation"
                            >
                              Reset
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setPreviewDoc({ url: activeDocUrl, label: activeLabel || '', isPdf })}
                          className="bg-[#104080] hover:bg-[#0c3162] text-white px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                          title="Open Fullscreen View"
                        >
                          <span>Fullscreen</span>
                          <span>⤢</span>
                        </button>
                        <a
                          href={activeDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white hover:bg-[#eef4fc] text-[#104080] border border-[#a2b5cd] px-2 py-0.5 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 shadow-xs"
                          title="Open file in new tab"
                        >
                          <span>Open Tab</span>
                          <span>↗</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Quick Jump Strip */}
                  <div className="bg-[#edf2f9] border-b border-[#a2b5cd] px-3 py-1 flex items-center gap-1 overflow-x-auto text-[10px]">
                    <span className="font-bold text-[#104080] text-[10px] mr-1 flex-shrink-0">
                      Quick View:
                    </span>
                    {docItems.map(({ label, short }) => {
                      const hasDoc = Boolean(documents[label]);
                      const isCur = activeLabel === label;

                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            setSelectedPreviewLabel(label);
                            setPreviewZoom(1);
                            setPreviewRotation(0);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition-all cursor-pointer flex-shrink-0 ${
                            isCur 
                              ? 'bg-[#104080] text-white font-bold shadow-xs' 
                              : hasDoc 
                                ? 'bg-white text-[#104080] border border-[#a2b5cd] font-semibold hover:bg-[#dbe8f9]' 
                                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {hasDoc && (
                            <span className={`w-1.5 h-1.5 rounded-full ${isCur ? 'bg-white' : 'bg-emerald-500'}`}></span>
                          )}
                          <span>{short}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Inspection Canvas Area */}
                  <div 
                    className="flex-1 w-full flex flex-col items-center justify-center p-4 relative min-h-[460px] overflow-auto"
                    style={{ 
                      backgroundColor: '#eef3f9', 
                      backgroundImage: 'radial-gradient(#c6d4e5 1px, transparent 1px)', 
                      backgroundSize: '16px 16px' 
                    }}
                  >
                    {activeDocUrl ? (
                      isPdf ? (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <iframe 
                            src={activeDocUrl} 
                            title={activeLabel || 'Document'} 
                            className="w-full h-[520px] bg-white border border-[#a2b5cd] rounded-sm shadow-md" 
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-3 overflow-hidden">
                          <div 
                            className="relative inline-block transition-transform duration-150 ease-out bg-white p-2 border-2 border-white rounded-sm shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
                            style={{ 
                              transform: `scale(${previewZoom}) rotate(${previewRotation}deg)` 
                            }}
                          >
                            <img 
                              src={activeDocUrl} 
                              alt={activeLabel || 'Preview'} 
                              className="max-w-full max-h-[460px] object-contain rounded-xs select-none pointer-events-none" 
                            />
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-8 bg-white/80 border border-[#c0d2e5] rounded-md shadow-xs max-w-md">
                        <div className="w-14 h-14 rounded-full bg-[#eef4fc] border border-[#a2b5cd] flex items-center justify-center text-[#104080] mb-3 shadow-inner">
                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                        </div>
                        <div className="font-extrabold text-[#104080] text-[13px] mb-1 uppercase tracking-wide">
                          KYC Document Inspection Canvas
                        </div>
                        <p className="text-gray-500 text-[11px] max-w-xs mb-3 leading-relaxed">
                          Select any uploaded document from the left vault or upload a new file to inspect high-resolution details, stamps, and legibility.
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-[#f4f7fc] px-3 py-1 rounded border border-[#a2b5cd]">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>Inspection tools: 90° Rotate • Zoom 50%-300% • Fullscreen</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Inspector Footer / Metadata Bar */}
                  {activeDocUrl && (
                    <div className="bg-[#f8fafc] border-t border-[#a2b5cd] px-3 py-1.5 text-[10px] text-gray-600 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span>Document: <b className="text-black">{activeLabel}</b></span>
                        <span className="text-gray-300">|</span>
                        <span className="truncate max-w-[260px]">File: {activeFile?.name || 'Uploaded File'}</span>
                        {activeFile && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span>Size: {Math.round(activeFile.size / 1024)} KB</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Inspection Ready</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {activeTab === 'Address Details' && (
            <div className="flex flex-col gap-4">
              {/* Address Details Box */}
              <div className="border-2 border-[#a2b5cd] bg-[#f9fbff] p-1 shadow-sm">
                <div className="bg-[#eaf0f8] px-2 py-1 font-bold text-[#104080] border-b border-[#a2b5cd] mb-2">
                  Address Details
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 p-2">
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Address Format</span>
                    <select className="flex-1 border border-[#7f9db9] bg-white h-[30px] focus:outline-none">
                      <option>Structured</option>
                      <option>Free Text</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Address Type</span>
                    <select className="flex-1 border border-[#7f9db9] bg-white h-[30px] focus:outline-none">
                      <option>MAILING</option>
                      <option>PERMANENT</option>
                      <option>BUSINESS</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">House No.</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Premise Name</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Building Level</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Street No.</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Suburb</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Street Name</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Locality</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Town</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold">City</span>
                    <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">State</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Country</span>
                    <div className="flex flex-1 gap-1">
                      <input type="text" className="w-8 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
                      <input type="text" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Postal Code</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Address Valid From</span>
                    <FinacleDatePicker className="flex-1 border border-[#7f9db9] px-2 h-[30px] bg-white text-[10px]" />
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Address Valid Till</span>
                    <FinacleDatePicker className="flex-1 border border-[#7f9db9] px-2 h-[30px] bg-white text-[10px]" />
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Address Proof Received</span>
                    <select className="flex-1 border border-[#7f9db9] bg-white h-[30px] focus:outline-none">
                      <option>--Select--</option>
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Last Updated Date</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] bg-gray-100 px-1 h-[30px] focus:outline-none" disabled />
                  </div>
                </div>

                <div className="bg-[#eaf0f8] px-2 py-1 font-bold text-[#104080] border-y border-[#a2b5cd] mb-2 mt-2">
                  Search
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 p-2">
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Hold Mail Indicator</span>
                    <select className="flex-1 border border-[#7f9db9] bg-white h-[30px] focus:outline-none">
                      <option>N</option>
                      <option>Y</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Hold Mail Initiated By</span>
                    <select className="flex-1 border border-[#7f9db9] bg-white h-[30px] focus:outline-none">
                      <option>--Select--</option>
                      <option>Customer</option>
                      <option>Bank</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Business Center Name</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none bg-gray-100" />
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Reason</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        {(() => {
          const currentTabIndex = tabs.indexOf(activeTab);
          const isFirstTab = currentTabIndex === 0;
          const isLastTab = currentTabIndex === tabs.length - 1;

          const handleBack = () => {
            if (!isFirstTab) {
              setActiveTab(tabs[currentTabIndex - 1]);
            }
          };

          const handleNext = () => {
            if (!isLastTab) {
              setActiveTab(tabs[currentTabIndex + 1]);
            }
          };

          return (
            <div className="mt-6 flex items-center justify-between border-t border-gray-300 pt-4">
              <div className="flex items-center gap-2">
                {/* Back Button */}
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isFirstTab}
                  className={`bg-[#d4d0c8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-gray-500 border-r-gray-500 px-4 py-1 select-none font-semibold text-[12px] text-black ${
                    isFirstTab 
                      ? 'opacity-40 cursor-not-allowed' 
                      : 'hover:bg-[#e4e4f0] active:border-t-gray-500 active:border-l-gray-500 active:border-b-white active:border-r-white cursor-pointer'
                  }`}
                >
                  &lt; Back
                </button>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isLastTab}
                  className={`bg-[#d4d0c8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-gray-500 border-r-gray-500 px-4 py-1 select-none font-semibold text-[12px] text-black ${
                    isLastTab 
                      ? 'opacity-40 cursor-not-allowed' 
                      : 'hover:bg-[#e4e4f0] active:border-t-gray-500 active:border-l-gray-500 active:border-b-white active:border-r-white cursor-pointer'
                  }`}
                >
                  Next &gt;
                </button>

                {/* Submit Button */}
                <button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`bg-[#d4d0c8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-gray-500 border-r-gray-500 px-4 py-1 select-none font-bold text-[12px] active:border-t-gray-500 active:border-l-gray-500 active:border-b-white active:border-r-white cursor-pointer hover:bg-[#e4e4f0] ${
                    isLastTab ? 'text-[#104080] border-b-[#104080] border-r-[#104080]' : 'text-black'
                  } ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>

                {/* Close Button */}
                <button 
                  type="button"
                  onClick={() => setStep('selection')}
                  className="bg-[#d4d0c8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-gray-500 border-r-gray-500 px-4 py-1 select-none font-semibold text-[12px] text-black hover:bg-[#e4e4f0] active:border-t-gray-500 active:border-l-gray-500 active:border-b-white active:border-r-white cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Step indicator text on the right */}
              <div className="text-[11px] text-gray-500 font-semibold pr-2">
                Step {currentTabIndex + 1} of {tabs.length}: <span className="text-[#104080] font-bold">{activeTab}</span>
              </div>
            </div>
          );
        })()}
      </div>

      {isSubmitted && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40"></div>
          <div className="absolute inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white p-4 shadow-2xl w-full max-w-xl flex flex-col mt-4" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
              <div className="border border-[#8f8f9d] p-[2px] bg-[#f0f0f5]">
                <div className="border border-[#8f8f9d] bg-white p-4 flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-b from-[#4facfe] to-[#00f2fe] flex items-center justify-center text-white font-serif italic font-bold text-sm shadow-sm border border-[#00a8ff]">
                    i
                  </div>
                  <span className="text-[14px] text-black">CIF ID {cifId} Created Successfully.</span>
                </div>
              </div>
              <button 
                onClick={handleOk}
                className="mt-2 self-start bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-4 py-1 text-sm font-semibold text-black"
              >
                Ok
              </button>
            </div>
          </div>
        </>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[90]"></div>
          <div className="absolute inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white border-2 border-[#104080] shadow-2xl w-full max-w-4xl max-h-[calc(100%-2rem)] flex flex-col mt-2">
              <div className="bg-[#eaf0f8] px-3 py-2 font-bold text-[#104080] border-b border-[#a2b5cd] flex justify-between items-center">
                <span>Document Preview - {previewDoc.label}</span>
                <button 
                  onClick={() => setPreviewDoc(null)} 
                  className="text-red-600 font-bold hover:underline cursor-pointer px-2"
                >
                  Close (X)
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4 min-h-[400px]">
                {previewDoc.isPdf ? (
                  <iframe src={previewDoc.url} title={previewDoc.label} className="w-full h-[550px] border border-gray-300" />
                ) : (
                  <img src={previewDoc.url} alt={previewDoc.label} className="max-w-full max-h-[550px] object-contain shadow-md" />
                )}
              </div>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
