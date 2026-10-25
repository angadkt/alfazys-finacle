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
            <div className="bg-[#e4e4e4] shadow-2xl flex flex-col max-h-[90vh] w-full max-w-lg border-2 border-[#104080] rounded-[2px] overflow-hidden">
              
              {/* Window Title Bar */}
              <div className="bg-[#104080] text-white px-2 py-1 flex items-center justify-between text-[11px] font-bold select-none cursor-move">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-[#104080]"></div>
                  </div>
                  Security Alert & Login Information
                </div>
                <button 
                  onClick={() => setIsSecurityModalOpen(false)}
                  className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border-t border-l border-white border-b border-r border-[#8f8f9d] hover:bg-[#d4d0c8]"
                >
                  X
                </button>
              </div>

              {/* Modal Body */}
              <div className="bg-white border border-[#a0a0a0] m-1 p-2 flex flex-col overflow-auto">
                
                {/* Password Expiry Alert */}
                <div className="flex items-center gap-3 py-2 px-1">
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white font-serif italic text-[14px] font-bold flex-shrink-0"
                    style={{ 
                      background: 'radial-gradient(circle at 30% 30%, #4facfe 0%, #00509e 100%)', 
                      boxShadow: '1px 1px 2px rgba(0,0,0,0.3)' 
                    }}
                  >
                    i
                  </div>
                  <span className="text-black font-bold text-[13px]">
                    Your password will expire after 68 days
                  </span>
                </div>

                {/* Login Info Sections (Compact, borderless) */}
                <div className="flex flex-col text-[12px] mt-1 tracking-tight">
                  
                  {/* Last Successful Login Info */}
                  <div className="bg-[#f0f4fa] py-1 px-1">
                    <span className="text-[#15549a] font-bold text-[13px]">Last Successful Login Information</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] py-1 px-1">
                    <span className="font-bold text-black">Last login time</span>
                    <span className="text-black">31-Mar-2016 10:38:08</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] py-1 px-1">
                    <span className="font-bold text-black">Last logout time</span>
                    <span className="text-black">31-Mar-2016 10:38:35</span>
                  </div>

                  {/* Last Failed Login Info */}
                  <div className="bg-[#f0f4fa] py-1 px-1 mt-2">
                    <span className="text-[#15549a] font-bold text-[13px]">Last Failed Login Information</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] py-1 px-1">
                    <span className="font-bold text-black">Last login time</span>
                    <span className="text-black">26-Mar-2016 12:35:14</span>
                  </div>

                  {/* Account Information */}
                  <div className="bg-[#f0f4fa] py-1 px-1 mt-2">
                    <span className="text-[#15549a] font-bold text-[13px]">Account Information</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] py-1 px-1">
                    <span className="font-bold text-black">Account Expiry Date</span>
                    <span className="text-black">11-07-2017</span>
                  </div>
                  
                </div>

                {/* Footer Buttons */}
                <div className="mt-4 pt-2 border-t border-[#e2e8f0] flex justify-end">
                  <button 
                    onClick={() => setIsSecurityModalOpen(false)}
                    className="bg-[#c0c0c0] text-black border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] hover:bg-[#d4d0c8] px-4 py-1 text-[12px] font-bold"
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
