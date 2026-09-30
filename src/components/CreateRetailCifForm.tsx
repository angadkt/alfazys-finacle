import { useState } from 'react';
import { dbService } from '../services/db';

export default function CreateRetailCifForm() {
  const [activeTab, setActiveTab] = useState('Basic Info');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [cifId, setCifId] = useState('');

  const [formData, setFormData] = useState({
    corporateName: '',
    shortName: '',
    uaeNo: '',
    email: '',
    indianNo: '',
    city: '',
    country: ''
  });

  const handleSubmit = () => {
    const newCustomer = dbService.addCustomer({
      name: formData.corporateName || 'New Customer',
      email: formData.email,
      phone: formData.uaeNo || formData.indianNo,
      country: formData.country,
      status: 'pending',
      balance: 0,
      shortName: formData.shortName,
      city: formData.city
    });
    
    setCifId(newCustomer.id);
    setIsSubmitted(true);
  };

  const handleOk = () => {
    setIsSubmitted(false);
    setActiveTab('Basic Info');
    setCifId('');
    setFormData({ corporateName: '', shortName: '', uaeNo: '', email: '', indianNo: '', city: '', country: '' });
  };

  const tabs = ['Basic Info', 'Contact Info', 'Identification Document', 'Address Details'];

  if (isSubmitted) {
    return (
      <div className="flex-1 flex flex-col bg-white p-4" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
        <div className="max-w-xl">
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
            className="mt-2 bg-[#e4e4f0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-4 py-1 text-sm font-semibold text-black"
          >
            Ok
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#e4e4e4] p-2 overflow-auto" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
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
                <span className="w-32 font-semibold">Corporate Name <span className="text-red-600">*</span></span>
                <input type="text" value={formData.corporateName} onChange={(e) => setFormData({...formData, corporateName: e.target.value})} className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Short Name <span className="text-red-600">*</span></span>
                <input type="text" value={formData.shortName} onChange={(e) => setFormData({...formData, shortName: e.target.value})} className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
              </div>
            </div>
          )}

          {activeTab === 'Contact Info' && (
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 max-w-4xl">
              <div className="flex items-center">
                <span className="w-32 font-semibold">UAE No</span>
                <input type="text" value={formData.uaeNo} onChange={(e) => setFormData({...formData, uaeNo: e.target.value})} className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Email ID</span>
                <input type="text" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Indian No</span>
                <input type="text" value={formData.indianNo} onChange={(e) => setFormData({...formData, indianNo: e.target.value})} className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Whatsapp No</span>
                <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
              </div>
              <div className="col-span-2 border-b border-[#e5e5e5] my-2"></div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Other Number 1</span>
                <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Relationship 1</span>
                <select className="flex-1 border border-[#7f9db9] bg-white h-[18px] focus:outline-none">
                  <option>--Select--</option>
                  <option>Spouse</option>
                  <option>Parent</option>
                  <option>Child</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Other Number 2</span>
                <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
              </div>
              <div className="flex items-center">
                <span className="w-32 font-semibold">Relationship 2</span>
                <select className="flex-1 border border-[#7f9db9] bg-white h-[18px] focus:outline-none">
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
            <div className="flex flex-col gap-3 max-w-2xl">
              <div className="bg-[#f4f7fc] border border-[#a2b5cd] p-3 flex flex-col gap-3">
                <div className="font-bold text-[#104080] mb-1">Document Upload</div>
                
                <div className="flex items-center justify-between">
                  <span className="w-48 font-semibold">Photo</span>
                  <input type="file" className="flex-1 text-[11px]" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="w-48 font-semibold">Passport 2 said / Adhaar</span>
                  <input type="file" className="flex-1 text-[11px]" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="w-48 font-semibold">UAE ID / PAN</span>
                  <input type="file" className="flex-1 text-[11px]" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="w-48 font-semibold">Signature</span>
                  <input type="file" className="flex-1 text-[11px]" />
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
                    <span className="w-36 font-semibold">Address Format <span className="text-red-600">*</span></span>
                    <select className="flex-1 border border-[#7f9db9] bg-white h-[18px] focus:outline-none">
                      <option>Structured</option>
                      <option>Free Text</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Address Type <span className="text-red-600">*</span></span>
                    <select className="flex-1 border border-[#7f9db9] bg-white h-[18px] focus:outline-none">
                      <option>MAILING</option>
                      <option>PERMANENT</option>
                      <option>BUSINESS</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">House No. <span className="text-red-600">*</span></span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Premise Name</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Building Level</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Street No. <span className="text-red-600">*</span></span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Suburb</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Street Name <span className="text-red-600">*</span></span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Locality</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Town</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold">City <span className="text-red-600">*</span></span>
                    <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">State <span className="text-red-600">*</span></span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Country <span className="text-red-600">*</span></span>
                    <div className="flex flex-1 gap-1">
                      <input type="text" className="w-8 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
                      <input type="text" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Postal Code <span className="text-red-600">*</span></span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Address Valid From <span className="text-red-600">*</span></span>
                    <input type="date" className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none text-[10px]" />
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Address Valid Till</span>
                    <input type="date" className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none text-[10px]" />
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Address Proof Received</span>
                    <select className="flex-1 border border-[#7f9db9] bg-white h-[18px] focus:outline-none">
                      <option>--Select--</option>
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Last Updated Date</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] bg-gray-100 px-1 h-[18px] focus:outline-none" disabled />
                  </div>
                </div>

                <div className="bg-[#eaf0f8] px-2 py-1 font-bold text-[#104080] border-y border-[#a2b5cd] mb-2 mt-2">
                  Search
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 p-2">
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Hold Mail Indicator <span className="text-red-600">*</span></span>
                    <select className="flex-1 border border-[#7f9db9] bg-white h-[18px] focus:outline-none">
                      <option>N</option>
                      <option>Y</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Hold Mail Initiated By</span>
                    <select className="flex-1 border border-[#7f9db9] bg-white h-[18px] focus:outline-none">
                      <option>--Select--</option>
                      <option>Customer</option>
                      <option>Bank</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Business Center Name</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none bg-gray-100" />
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-semibold">Reason</span>
                    <input type="text" className="flex-1 border border-[#7f9db9] px-1 h-[18px] focus:outline-none" />
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
    </div>
  );
}
