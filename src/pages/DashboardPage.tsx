import Header from '../components/Header';

export default function DashboardPage() {
  return (
    <div className="min-h-screen w-full bg-[#f4f7fa] flex flex-col font-sans antialiased">
      <Header />

      {/* Main Content Area (Spacious and fills viewport) */}
      <div className="flex-1 w-full bg-[#f4f7fb] flex flex-col gap-0 px-4 py-4">
        
        {/* Password Expiry Alert */}
        <div className="bg-[#f0f4fa] border border-[#d1d9e6] border-l-4 border-l-[#2563eb] py-3 px-4 rounded shadow-sm flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-[#2563eb] text-white font-serif italic font-medium flex items-center justify-center text-xs shadow-sm flex-shrink-0">
            i
          </div>
          <span className="text-[#1e3a8a] font-medium text-[13px]">
            Your password will expire after 44 days
          </span>
        </div>

        {/* Data Cards Container */}
        <div className="flex flex-col gap-0 pb-0">

          {/* Last Successful Login Card */}
          <div className="bg-white rounded-md shadow-sm border border-[#e2e8f0] overflow-hidden">
            <div className="bg-[#f1f5f9] border-b border-[#e2e8f0] px-4 py-2.5">
              <h2 className="text-[#1e4676] font-semibold text-[13px]">Last Successful Login Information</h2>
            </div>
            <div className="px-4 py-4 grid grid-cols-2 gap-x-16 gap-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium text-[12px]">Last login time</span>
                <span className="text-gray-900 font-semibold text-[12px]">28-Feb-2015 13:01:15</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium text-[12px]">Client machine</span>
                <span className="text-gray-900 font-semibold text-[12px]">10.80.200.246</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium text-[12px]">Last logout time</span>
                <span className="text-gray-900 font-semibold text-[12px]">28-Feb-2015 13:01:52</span>
              </div>
            </div>
          </div>

          {/* Last Failed Login Card */}
          <div className="bg-white rounded-md shadow-sm border border-[#e2e8f0] overflow-hidden">
            <div className="bg-[#f1f5f9] border-b border-[#e2e8f0] px-4 py-2.5">
              <h2 className="text-[#1e4676] font-semibold text-[13px]">Last Failed Login Information</h2>
            </div>
            <div className="px-4 py-4 grid grid-cols-2 gap-x-16 gap-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium text-[12px]">Last login time</span>
                <span className="text-gray-900 font-semibold text-[12px]">28-Feb-2015 12:52:20</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium text-[12px]">Client machine</span>
                <span className="text-gray-900 font-semibold text-[12px]">10.80.200.246</span>
              </div>
            </div>
          </div>

          {/* Account Information Card */}
          <div className="bg-white rounded-md shadow-sm border border-[#e2e8f0] overflow-hidden">
            <div className="bg-[#f1f5f9] border-b border-[#e2e8f0] px-4 py-2.5">
              <h2 className="text-[#1e4676] font-semibold text-[13px]">Account Information</h2>
            </div>
            <div className="px-4 py-4 grid grid-cols-2 gap-x-16 gap-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium text-[12px]">Account Expiry Date</span>
                <span className="text-gray-900 font-semibold text-[12px]">31-12-2099</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
