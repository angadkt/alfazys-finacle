import React, { useState } from 'react';

import api from '../services/api';

export default function CreateRetailCifForm() {
  const [step, setStep] = useState('selection');
  const [activeTab, setActiveTab] = useState('Basic Info');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [cifId, setCifId] = useState('');
  const [selectedFunction, setSelectedFunction] = useState('');
  const [inputCifId, setInputCifId] = useState('');
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [previewDoc, setPreviewDoc] = useState<{url: string, label: string} | null>(null);

  const handleFileUpload = (label: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setDocuments(prev => ({ ...prev, [label]: url }));
      setPreviewDoc({ url, label });
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
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert('Please fill in all mandatory fields (First Name and Last Name).');
      return;
    }

    const payload = {
      first_name: formData.firstName || 'Unknown',
      last_name: formData.lastName,
      short_name: formData.shortName,
      gender: formData.gender,
      nationality: formData.nationality,
      contact_number: formData.contactNo || formData.uaeNo || formData.indianNo || '0000000000',
      branch_id: formData.branchOffice === 'UAE' ? 1 : 2, 
      cif_type_id: formData.cifType === 'Agent' ? 1 : formData.cifType === 'Customer' ? 2 : formData.cifType === 'Supplier' ? 7 : 4,
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

    try {
      const res = await api.post('/records/parties', payload);
      setCifId(res.data.record.cif_no || res.data.record.id);
      setIsSubmitted(true);
    } catch (err: any) {
      alert('Error saving CIF: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOk = () => {
    setIsSubmitted(false);
    setActiveTab('Basic Info');
    setCifId('');
    setStep('selection');
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
                <span className="w-32 font-semibold">Title</span>
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
                <span className="w-32 font-semibold">Short Name</span>
                <input type="text" value={formData.shortName} onChange={(e) => setFormData({...formData, shortName: e.target.value})} className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Gender</span>
                <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="flex-1 border border-[#7f9db9] bg-white h-[30px] focus:outline-none">
                  <option value=""></option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Nationality</span>
                <input type="text" value={formData.nationality} onChange={(e) => setFormData({...formData, nationality: e.target.value})} className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Contact No</span>
                <input type="text" value={formData.contactNo} onChange={(e) => setFormData({...formData, contactNo: e.target.value})} className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none" />
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">CCY</span>
                <select value={formData.ccy} onChange={(e) => setFormData({...formData, ccy: e.target.value})} className="flex-1 border border-[#7f9db9] bg-white h-[30px] focus:outline-none">
                  <option value=""></option>
                  <option value="INR">INR</option>
                  <option value="AED">AED</option>
                </select>
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Branch Office</span>
                <select value={formData.branchOffice} onChange={(e) => setFormData({...formData, branchOffice: e.target.value})} className="flex-1 border border-[#7f9db9] bg-white h-[30px] focus:outline-none">
                  <option value=""></option>
                  <option value="UAE">UAE</option>
                  <option value="INDIA">INDIA</option>
                </select>
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">CIF Type</span>
                <select value={formData.cifType} onChange={(e) => setFormData({...formData, cifType: e.target.value})} className="flex-1 border border-[#7f9db9] bg-white h-[30px] focus:outline-none">
                  <option value=""></option>
                  <option value="Customer">Customer</option>
                  <option value="Agent">Agent</option>
                  <option value="Supplier">Supplier</option>
                  <option value="General">General</option>
                  <option value="Other">Other</option>
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

          {activeTab === 'Identification Document' && (
            <div className="flex flex-col gap-3 max-w-3xl">
              <div className="bg-[#f4f7fc] border border-[#a2b5cd] p-4 flex flex-col gap-3">
                <div className="font-bold text-[#104080] border-b border-[#a2b5cd] pb-1 mb-1">Document Upload</div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {[
                    'Photo',
                    'Passport (Front)',
                    'Passport (Back)',
                    'Aadhaar (Front)',
                    'Aadhaar (Back)',
                    'UAE ID / PAN',
                    'Signature'
                  ].map((label, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5">
                      <span className="font-semibold text-black">{label}</span>
                      <div className="flex items-center justify-between border border-[#a2b5cd] bg-white p-2 relative group hover:border-[#316ac5] transition-colors rounded-sm h-[46px] overflow-hidden">
                        <input 
                          type="file" 
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(label, e)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                          title=" " 
                        />
                        {documents[label] ? (
                          <div 
                            className="flex items-center gap-2 w-full h-full cursor-pointer"
                            onClick={(e) => {
                               e.preventDefault();
                               e.stopPropagation();
                               setPreviewDoc({ url: documents[label], label });
                            }}
                          >
                            <img src={documents[label]} alt={label} className="h-8 w-8 object-cover rounded-sm border border-gray-300 flex-shrink-0" />
                            <span className="text-[#316ac5] font-semibold text-[11px] truncate flex-1">Document uploaded</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#316ac5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="17 8 12 3 7 8"></polyline>
                              <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            <div className="flex flex-col leading-tight">
                              <span className="text-[#316ac5] font-semibold text-[11px]">Upload file</span>
                              <span className="text-[9px] text-gray-500 mt-[1px]">JPG, PNG or PDF</span>
                            </div>
                          </div>
                        )}
                        {!documents[label] && (
                          <div className="bg-[#316ac5] border border-[#104080] px-3 py-1 text-white font-semibold text-[10px] rounded-sm shadow-sm group-hover:bg-[#104080] transition-colors">
                            Browse
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
                    <input type="date" className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none text-[10px]" />
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Address Valid Till</span>
                    <input type="date" className="flex-1 border border-[#7f9db9] px-1 h-[30px] focus:outline-none text-[10px]" />
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
        <div className="mt-6 flex gap-2 border-t border-gray-300 pt-4">
          <button className="bg-[#d4d0c8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-gray-500 border-r-gray-500 px-4 py-1 active:border-t-gray-500 active:border-l-gray-500 active:border-b-white active:border-r-white">
            Save
          </button>
          <button 
            onClick={handleSubmit}
            className="bg-[#d4d0c8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-gray-500 border-r-gray-500 px-4 py-1 active:border-t-gray-500 active:border-l-gray-500 active:border-b-white active:border-r-white"
          >
            Submit
          </button>
          <button className="bg-[#d4d0c8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-gray-500 border-r-gray-500 px-4 py-1 active:border-t-gray-500 active:border-l-gray-500 active:border-b-white active:border-r-white">
            Close
          </button>
        </div>
      </div>

      {isSubmitted && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-4 shadow-2xl w-full max-w-xl flex flex-col" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
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
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#104080] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
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
              <img src={previewDoc.url} alt={previewDoc.label} className="max-w-full max-h-full object-contain shadow-md" />
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
