import { useState } from 'react';
import Header from '../components/Header';

export default function DashboardPage() {
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(true);

  return (
    <div className="min-h-screen w-full bg-[#f4f7fa] flex flex-col antialiased" style={{ fontFamily: 'Arial, Tahoma, sans-serif' }}>
      <Header />

      {/* Main Content Area (Spacious and fills viewport) */}
      <div className="flex-1 w-full bg-[#f4f7fb] flex items-center justify-center relative">
        
        {/* Placeholder Dashboard Background */}
        <div className="opacity-20 text-center select-none pointer-events-none">
          <h1 className="text-5xl font-bold text-[#104080]">Infazys Finacle</h1>
          <p className="text-xl mt-3 font-semibold text-gray-600">Universal Payment Solution Dashboard</p>
        </div>
        
        {/* Security / Login History Modal */}
        {isSecurityModalOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white shadow-2xl flex flex-col max-h-[90vh] w-full max-w-lg border border-[#0E498C] rounded-sm overflow-hidden">
              
              {/* Window Title Bar */}
              <div className="bg-[#0E498C] text-white px-3.5 py-2 flex items-center justify-between text-[12px] font-bold select-none border-b border-[#00B5E2]/40">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#FFB800] rounded-xs flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-[#0E498C]"></div>
                  </div>
                  <span>Security Alert & Login Information</span>
                </div>
                <button 
                  onClick={() => setIsSecurityModalOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="bg-white m-1 p-3 flex flex-col overflow-auto">
                
                {/* Password Expiry Alert */}
                <div className="flex items-center gap-3 py-2 px-1">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white bg-[#00A2E8] text-[13px] font-bold flex-shrink-0">
                    i
                  </div>
                  <span className="text-[#0E498C] font-bold text-[13px]">
                    Your password will expire after 68 days
                  </span>
                </div>

                {/* Login Info Sections (Compact, borderless) */}
                <div className="flex flex-col text-[12px] mt-1 tracking-tight">
                  
                  {/* Last Successful Login Info */}
                  <div className="bg-[#EBF6FC] py-1 px-2 rounded-xs">
                    <span className="text-[#0E498C] font-bold text-[13px]">Last Successful Login Information</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] py-1 px-2">
                    <span className="font-bold text-gray-700">Last login time</span>
                    <span className="text-gray-900 font-mono">31-Mar-2016 10:38:08</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] py-1 px-2">
                    <span className="font-bold text-gray-700">Last logout time</span>
                    <span className="text-gray-900 font-mono">31-Mar-2016 10:38:35</span>
                  </div>

                  {/* Last Failed Login Info */}
                  <div className="bg-[#EBF6FC] py-1 px-2 rounded-xs mt-2">
                    <span className="text-[#0E498C] font-bold text-[13px]">Last Failed Login Information</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] py-1 px-2">
                    <span className="font-bold text-gray-700">Last login time</span>
                    <span className="text-gray-900 font-mono">26-Mar-2016 12:35:14</span>
                  </div>

                  {/* Account Information */}
                  <div className="bg-[#EBF6FC] py-1 px-2 rounded-xs mt-2">
                    <span className="text-[#0E498C] font-bold text-[13px]">Account Information</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] py-1 px-2">
                    <span className="font-bold text-gray-700">Account Expiry Date</span>
                    <span className="text-gray-900 font-mono">11-07-2017</span>
                  </div>
                  
                </div>

                {/* Footer Buttons */}
                <div className="mt-4 pt-2 border-t border-gray-200 flex justify-end">
                  <button 
                    onClick={() => setIsSecurityModalOpen(false)}
                    className="bg-[#0E498C] hover:bg-[#00A2E8] border border-[#00B5E2]/40 text-white rounded-xs px-4 py-1.5 text-[12px] font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    Acknowledge & Continue
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
