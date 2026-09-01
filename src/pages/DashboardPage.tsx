import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../services/db';
import logoImg from '../assets/alfazys-logo-nobg.png';

// Custom inline SVG Icons for a clean, dependency-free installation
const MenuIcon = ({ onClick }: { onClick?: () => void }) => (
  <svg
    onClick={onClick}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-6 h-6 text-white cursor-pointer hover:text-white/80 transition mr-2 flex-shrink-0"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const HomeIcon = ({ onClick }: { onClick?: () => void }) => (
  <svg
    onClick={onClick}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-5.5 h-5.5 text-white cursor-pointer hover:text-white/80 transition flex-shrink-0"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const PowerIcon = ({ className = "w-5.5 h-5.5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
  </svg>
);

const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-13.5 0v-2.25Z" />
  </svg>
);

const CustomersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

const AgentsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
);

const LoansSidebarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12V8.4a2.4 2.4 0 0 0-2.4-2.4H4.8A2.4 2.4 0 0 0 2.4 8.4v7.2a2.4 2.4 0 0 0 2.4 2.4h13.8a2.4 2.4 0 0 0 2.4-2.4V14m0-2h-3.6a1.8 1.8 0 1 1 0-3.6H21" />
  </svg>
);

const AedCollectionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <circle cx="9" cy="12" r="5.5" />
    <circle cx="15" cy="12" r="5.5" />
  </svg>
);

const OfficeAccountsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18" />
  </svg>
);

const KycPanelIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375H16.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    <circle cx="12" cy="12" r="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 16c0-1.5 1.5-2 3-2s3 .5 3 2" />
  </svg>
);

const BusinessHealthIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-3.75-1.002m3.75 1.002-1.002 3.75" />
  </svg>
);

const AuditLogsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375H16.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);


const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

const BellIcon = ({ className = "w-5.5 h-5.5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4.5 h-4.5 text-slate-600 flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
  </svg>
);


// Grid Section custom vector SVGs representing layout elements
const AccountsServicesIcon = () => (
  <div className="w-12 h-12 flex items-center justify-center relative">
    <svg viewBox="0 0 64 64" className="w-11 h-11">
      <path d="M42 38c5.5 0 10 4.5 10 10v2H32v-2c0-5.5 4.5-10 10-10zm0-16a7 7 0 1 1 0 14 7 7 0 0 1 0-14z" fill="#16335f" opacity="0.55" />
      <path d="M22 34c6.6 0 12 5.4 12 12v4H10v-4c0-6.6 5.4-12 12-12zm0-18a8 8 0 1 1 0 16 8 8 0 0 1 0-16z" fill="#16335f" />
    </svg>
  </div>
);

const PayTransferIcon = () => (
  <div className="w-12 h-12 flex items-center justify-center relative">
    <svg viewBox="0 0 64 64" className="w-11 h-11">
      <path d="M14 22h36v-4L58 24l-8 6v-4H14v-4z" fill="#16335f" opacity="0.55" transform="rotate(180 32 24)" />
      <path d="M14 40h36v-4L58 42l-8 6v-4H14v-4z" fill="#16335f" />
    </svg>
  </div>
);

const DepositsIcon = () => (
  <div className="w-12 h-12 flex items-center justify-center relative">
    <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke="#16335f" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="16" width="48" height="32" rx="4" />
      <line x1="8" y1="26" x2="56" y2="26" strokeWidth="4" />
      <path d="M32 42V32M27 37l5-5 5 5" strokeWidth="3" />
      <rect x="14" y="34" width="6" height="6" rx="1" fill="#16335f" stroke="none" />
    </svg>
  </div>
);

const LoansIcon = () => (
  <div className="w-12 h-12 flex items-center justify-center relative">
    <svg viewBox="0 0 64 64" className="w-10 h-10" fill="#16335f">
      <path d="M8 40c4 0 10-3 14-3h20c2.2 0 4-1.8 4-4s-1.8-4-4-4h-8c-1.1 0-2-.9-2-2s.9-2 2-2h6c1.7 0 3-1.3 3-3s-1.3-3-3-3h-12c-3.3 0-6 2.7-6 6v1c0 1.1-.9 2-2 2H10c-1.1 0-2 .9-2 2s.9 2 2 2z" />
      <circle cx="34" cy="13" r="4.5" />
      <circle cx="24" cy="18" r="3.5" />
      <circle cx="44" cy="18" r="3.5" />
    </svg>
  </div>
);

const HeadOfficeIcon = () => (
  <div className="w-12 h-12 flex items-center justify-center relative">
    <svg viewBox="0 0 64 64" className="w-10 h-10" fill="#16335f">
      <polygon points="32,12 8,24 56,24" />
      <rect x="10" y="24" width="44" height="4" />
      <rect x="14" y="28" width="4" height="18" />
      <rect x="23" y="28" width="4" height="18" />
      <rect x="32" y="28" width="4" height="18" />
      <rect x="41" y="28" width="4" height="18" />
      <rect x="50" y="28" width="4" height="18" />
      <rect x="6" y="46" width="52" height="6" rx="1" />
    </svg>
  </div>
);


const ReportsIcon = () => (
  <div className="w-12 h-12 flex items-center justify-center relative">
    <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke="#16335f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 10h24l12 12v32H14V10z" strokeWidth="3.5" />
      <path d="M38 10v12h12" fill="none" />
      <path d="M20 44l6-8 8 6 10-12" strokeWidth="3" />
      <circle cx="44" cy="30" r="2" fill="#16335f" stroke="none" />
    </svg>
  </div>
);

const ApartmentIcon = () => (
  <div className="w-12 h-12 flex items-center justify-center relative">
    <svg viewBox="0 0 64 64" className="w-10 h-10" fill="#16335f">
      <rect x="18" y="10" width="28" height="44" rx="1" />
      <rect x="22" y="14" width="4" height="4" fill="white" />
      <rect x="30" y="14" width="4" height="4" fill="white" />
      <rect x="38" y="14" width="4" height="4" fill="white" />

      <rect x="22" y="22" width="4" height="4" fill="white" />
      <rect x="30" y="22" width="4" height="4" fill="white" />
      <rect x="38" y="22" width="4" height="4" fill="white" />

      <rect x="22" y="30" width="4" height="4" fill="white" />
      <rect x="30" y="30" width="4" height="4" fill="white" />
      <rect x="38" y="30" width="4" height="4" fill="white" />

      <rect x="22" y="38" width="4" height="4" fill="white" />
      <rect x="30" y="38" width="4" height="4" fill="white" />
      <rect x="38" y="38" width="4" height="4" fill="white" />

      <rect x="29" y="46" width="6" height="8" fill="white" />
    </svg>
  </div>
);

const ShareIcon = () => (
  <div className="w-12 h-12 flex items-center justify-center relative">
    <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke="#16335f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="46" cy="18" r="6" fill="#16335f" stroke="none" />
      <circle cx="18" cy="32" r="6" fill="#16335f" stroke="none" />
      <circle cx="46" cy="46" r="6" fill="#16335f" stroke="none" />
      <line x1="24" y1="29.5" x2="40" y2="20.5" />
      <line x1="24" y1="34.5" x2="40" y2="43.5" />
    </svg>
  </div>
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const activeRole = dbService.getUserRole();
  const currentUser = dbService.getUser();
  const [pendingCount, setPendingCount] = useState(0);
  const isAdmin = activeRole === 'super_admin';

  useEffect(() => {
    const custs = dbService.getCustomers();
    setPendingCount(custs.filter(c => c && c.status === 'pending').length);
  }, []);

  const [loginTime] = useState(() => {
    let stored = localStorage.getItem('infazys_finacle_login_time');
    if (!stored) {
      stored = new Date().toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      localStorage.setItem('infazys_finacle_login_time', stored);
    }
    return stored;
  });

  const [calcAed, setCalcAed] = useState<string>('');
  const [calcSaleRate, setCalcSaleRate] = useState<string>('');
  const [calcCostRate, setCalcCostRate] = useState<string>('');

  // Mock summary data for payment summary cards
  const inrSummary = { confirmed: 2450000, approved: 1875000, pending: 580000 };
  const aedSummary = { confirmed: 125000, approved: 89500, pending: 35500 };
  const handSummary = { confirmed: 975000 };

  const aedVal = parseFloat(calcAed);
  const saleRateVal = parseFloat(calcSaleRate);

  const hasValidInputs = !isNaN(aedVal) && aedVal > 0 && !isNaN(saleRateVal) && saleRateVal > 0;

  const calculatedInrVal = hasValidInputs ? (aedVal * saleRateVal) : 0;
  const calculatedProfitVal = hasValidInputs ? (aedVal * saleRateVal) : 0;

  const formattedInr = calculatedInrVal.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const formattedProfit = calculatedProfitVal.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased selection:bg-[#9e0248]/10 selection:text-[#9e0248]">

      {/* Premium Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#9e0248] shadow-[0_2px_15px_rgba(0,0,0,0.08)]">
        <div className="w-full h-20 flex items-center justify-between px-5 relative">

          {/* Logo Brand */}
          <div className="flex items-center text-white select-none">
            <MenuIcon onClick={() => setSidebarExpanded(!sidebarExpanded)} />
            <div className="flex items-center pl-1 pr-3">
              <HomeIcon onClick={() => navigate('/dashboard')} />
            </div>
            <div className="flex flex-col justify-center ml-1">
              <span className="text-[28px] font-medium font-montserrat tracking-widest text-white leading-none whitespace-nowrap">
                INFAZYS FINACLE
              </span>
              <span className="text-[14px] text-white/90 tracking-wide whitespace-nowrap">
                Universal Payment Solution From Infazys
              </span>
            </div>
            <img src={logoImg} alt="Infazys Logo" className="h-16 w-16 object-contain ml-3.5" />
          </div>

          {/* Centered Search Bar */}
          <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm xl:max-w-md px-4 z-20">
            <div className="flex items-center gap-3 bg-white/15 border border-white/25 rounded-2xl px-4 py-2 h-11 transition-all duration-200 focus-within:bg-white/20 focus-within:border-white/40">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search transactions, accounts, services..."
                className="w-full bg-transparent border-none outline-none text-sm text-white placeholder:text-white/60 font-semibold"
              />
            </div>
          </div>

          {/* Right Actions Menu */}
          <div className="flex items-center gap-4 sm:gap-6 relative z-10">

            {/* User Session Info */}
            <div className="flex items-center gap-3.5 select-none">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-white/40 shadow-sm"
              />
              <div className="flex flex-col text-left justify-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white leading-tight">
                    {currentUser.name}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                    isAdmin ? 'bg-amber-400 text-slate-950' : 'bg-white/25 text-white'
                  }`}>
                    {isAdmin ? 'Checker' : activeRole === 'staff' ? 'Staff Maker' : 'Agent'}
                  </span>
                </div>
                <span className="text-[11px] text-white/70 font-semibold mt-0.5 leading-tight block">
                  Last login: {loginTime}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-white/25 hidden sm:block" />

            {/* Notification & Logout */}
            <div className="flex items-center gap-4">
              <BellIcon className="w-5.5 h-5.5 text-white cursor-pointer hover:text-white/80 transition" />

              <button
                onClick={() => navigate('/')}
                className="group relative text-white hover:text-white/80 transition cursor-pointer flex items-center justify-center"
              >
                <PowerIcon className="w-5.5 h-5.5 text-white" />

                {/* Tooltip */}
                <div className="absolute top-[calc(100%+14px)] left-1/2 -translate-x-1/2 bg-[#0c2340] text-white text-[11px] font-bold py-1.5 px-3.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg z-50">
                  Logout
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#0c2340]" />
                </div>
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* Main Layout Grid with Collapsible Sidebar */}
      <div className="flex flex-1 relative">

        {/* Collapsible Sidebar Toggled via Header Menu Button */}
        <aside className={`fixed left-0 top-20 bottom-0 bg-white z-30 transition-all duration-300 overflow-hidden flex flex-col justify-between ${sidebarExpanded ? 'w-64 border-r border-slate-100 shadow-2xl py-6' : 'w-0 border-none py-0'}`}>

          {/* Navigation Links List */}
          <nav className="flex-1 overflow-y-auto space-y-3 px-3 scrollbar-none">

            {/* DASHBOARD */}
            <div
              onClick={() => navigate('/dashboard')}
              className="flex items-center h-16 px-3 rounded-2xl transition bg-[#9e0248]/5 border-r-4 border-[#9e0248] cursor-pointer"
            >
              <span className="flex-shrink-0 bg-[#9e0248] text-white p-2 rounded-2xl flex items-center justify-center">
                <DashboardIcon />
              </span>
              <span className={`ml-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-[#9e0248] transition-opacity duration-200 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                DASHBOARD
              </span>
            </div>

            {/* CUSTOMERS */}
            <div
              onClick={() => navigate('/customers')}
              className="flex items-center h-16 px-3 rounded-2xl transition hover:bg-slate-50 group/item cursor-pointer"
            >
              <span className="flex-shrink-0 bg-[#f0f7ff] text-[#2563eb] p-2 rounded-2xl flex items-center justify-center group-hover/item:bg-blue-100/50 transition">
                <CustomersIcon />
              </span>
              <div className={`ml-4 flex items-center justify-between flex-1 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap text-[#1e293b] group-hover/item:text-[#2563eb]">
                  CUSTOMERS
                </span>
                {isAdmin && pendingCount > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </div>
              <span className={`ml-auto text-[#2563eb] transition-opacity duration-200 flex ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <ChevronRightIcon />
              </span>
            </div>

            {/* AGENTS */}
            <a
              href="#agents"
              className="flex items-center h-16 px-3 rounded-2xl transition hover:bg-slate-50 group/item"
            >
              <span className="flex-shrink-0 bg-[#f0f7ff] text-[#2563eb] p-2 rounded-2xl flex items-center justify-center group-hover/item:bg-blue-100/50 transition">
                <AgentsIcon />
              </span>
              <span className={`ml-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-[#1e293b] group-hover/item:text-[#2563eb] transition-all duration-200 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                AGENTS
              </span>
              <span className={`ml-auto text-[#2563eb] transition-opacity duration-200 flex ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <ChevronRightIcon />
              </span>
            </a>

            {/* LOANS */}
            <a
              href="#loans"
              className="flex items-center h-16 px-3 rounded-2xl transition hover:bg-slate-50 group/item"
            >
              <span className="flex-shrink-0 bg-[#f0f7ff] text-[#2563eb] p-2 rounded-2xl flex items-center justify-center group-hover/item:bg-blue-100/50 transition">
                <LoansSidebarIcon />
              </span>
              <span className={`ml-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-[#1e293b] group-hover/item:text-[#2563eb] transition-all duration-200 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                LOANS
              </span>
              <span className={`ml-auto text-[#2563eb] transition-opacity duration-200 flex ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <ChevronRightIcon />
              </span>
            </a>

            {/* AED COLLECTION */}
            <a
              href="#aed-collection"
              className="flex items-center h-16 px-3 rounded-2xl transition hover:bg-slate-50 group/item"
            >
              <span className="flex-shrink-0 bg-[#f0f7ff] text-[#2563eb] p-2 rounded-2xl flex items-center justify-center group-hover/item:bg-blue-100/50 transition">
                <AedCollectionIcon />
              </span>
              <span className={`ml-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-[#1e293b] group-hover/item:text-[#2563eb] transition-all duration-200 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                AED COLLECTION
              </span>
              <span className={`ml-auto text-[#2563eb] transition-opacity duration-200 flex ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <ChevronRightIcon />
              </span>
            </a>

            {/* OFFICE ACCOUNTS */}
            <a
              href="#office-accounts"
              className="flex items-center h-16 px-3 rounded-2xl transition hover:bg-slate-50 group/item"
            >
              <span className="flex-shrink-0 bg-[#f0f7ff] text-[#2563eb] p-2 rounded-2xl flex items-center justify-center group-hover/item:bg-blue-100/50 transition">
                <OfficeAccountsIcon />
              </span>
              <span className={`ml-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-[#1e293b] group-hover/item:text-[#2563eb] transition-all duration-200 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                OFFICE ACCOUNTS
              </span>
              <span className={`ml-auto text-[#2563eb] transition-opacity duration-200 flex ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <ChevronRightIcon />
              </span>
            </a>

            {/* KYC PANEL */}
            <a
              href="#kyc-panel"
              className="flex items-center h-16 px-3 rounded-2xl transition hover:bg-slate-50 group/item"
            >
              <span className="flex-shrink-0 bg-[#f0f7ff] text-[#2563eb] p-2 rounded-2xl flex items-center justify-center group-hover/item:bg-blue-100/50 transition">
                <KycPanelIcon />
              </span>
              <span className={`ml-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-[#1e293b] group-hover/item:text-[#2563eb] transition-all duration-200 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                KYC PANEL
              </span>
              <span className={`ml-auto text-[#2563eb] transition-opacity duration-200 flex ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <ChevronRightIcon />
              </span>
            </a>

            {/* BUSINESS HEALTH */}
            <a
              href="#business-health"
              className="flex items-center h-16 px-3 rounded-2xl transition hover:bg-slate-50 group/item"
            >
              <span className="flex-shrink-0 bg-[#f0f7ff] text-[#2563eb] p-2 rounded-2xl flex items-center justify-center group-hover/item:bg-blue-100/50 transition">
                <BusinessHealthIcon />
              </span>
              <span className={`ml-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-[#1e293b] group-hover/item:text-[#2563eb] transition-all duration-200 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                BUSINESS HEALTH
              </span>
              <span className={`ml-auto text-[#2563eb] transition-opacity duration-200 flex ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <ChevronRightIcon />
              </span>
            </a>

            {/* AUDIT LOGS */}
            <a
              href="#audit-logs"
              className="flex items-center h-16 px-3 rounded-2xl transition hover:bg-slate-50 group/item"
            >
              <span className="flex-shrink-0 bg-[#f0f7ff] text-[#2563eb] p-2 rounded-2xl flex items-center justify-center group-hover/item:bg-blue-100/50 transition">
                <AuditLogsIcon />
              </span>
              <span className={`ml-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-[#1e293b] group-hover/item:text-[#2563eb] transition-all duration-200 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                AUDIT LOGS
              </span>
              <span className={`ml-auto text-[#2563eb] transition-opacity duration-200 flex ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <ChevronRightIcon />
              </span>
            </a>

          </nav>

        </aside>

        {/* Content body offset by sidebar size, removing layout margins/paddings */}
        <main className={`flex-1 w-full py-0 transition-all duration-300 ${sidebarExpanded ? 'pl-64' : 'pl-0'}`}>

          {/* Action Cards Grid - Zero gap and segmented border line layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-0 bg-white">

            {/* Accounts & Services */}
            <div className="bg-white border border-slate-500 hover:bg-slate-50/50 transition-all duration-300 py-5 px-2 flex flex-col items-center justify-center text-center cursor-pointer">
              <AccountsServicesIcon />
              <span className="text-[11px] font-bold text-slate-700 mt-2 leading-tight">Accounts & Services</span>
            </div>

            {/* Pay & Transfer */}
            <div className="bg-white border border-slate-500 hover:bg-slate-50/50 transition-all duration-300 py-5 px-2 flex flex-col items-center justify-center text-center cursor-pointer">
              <PayTransferIcon />
              <span className="text-[11px] font-bold text-slate-700 mt-2 leading-tight">Pay & Transfer</span>
            </div>

            {/* Deposits */}
            <div className="bg-white border border-slate-500 hover:bg-slate-50/50 transition-all duration-300 py-5 px-2 flex flex-col items-center justify-center text-center cursor-pointer">
              <DepositsIcon />
              <span className="text-[11px] font-bold text-slate-700 mt-2 leading-tight">Deposits</span>
            </div>

            {/* Loans */}
            <div className="bg-white border border-slate-500 hover:bg-slate-50/50 transition-all duration-300 py-5 px-2 flex flex-col items-center justify-center text-center cursor-pointer">
              <LoansIcon />
              <span className="text-[11px] font-bold text-slate-700 mt-2 leading-tight">Loans</span>
            </div>

            {/* Head Office Account */}
            <div className="bg-white border border-slate-500 hover:bg-slate-50/50 transition-all duration-300 py-5 px-2 flex flex-col items-center justify-center text-center cursor-pointer">
              <HeadOfficeIcon />
              <span className="text-[11px] font-bold text-slate-700 mt-2 leading-tight">Head Office Account</span>
            </div>

            {/* Customers Registry */}
            <div 
              onClick={() => navigate('/customers')}
              className="bg-white border border-slate-500 hover:bg-slate-50/50 transition-all duration-300 py-5 px-2 flex flex-col items-center justify-center text-center cursor-pointer relative group"
            >
              <div className="w-12 h-12 flex items-center justify-center relative">
                <svg viewBox="0 0 64 64" className="w-10 h-10" fill="#16335f">
                  <path d="M42 38c5.5 0 10 4.5 10 10v2H32v-2c0-5.5 4.5-10 10-10zm0-16a7 7 0 1 1 0 14 7 7 0 0 1 0-14z" fill="#16335f" opacity="0.55" />
                  <path d="M22 34c6.6 0 12 5.4 12 12v4H10v-4c0-6.6 5.4-12 12-12zm0-18a8 8 0 1 1 0 16 8 8 0 0 1 0-16z" fill="#16335f" />
                </svg>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-[11px] font-bold text-slate-700 leading-tight">Customers Registry</span>
                {isAdmin && pendingCount > 0 && (
                  <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </div>
            </div>

            {/* Reports */}
            <div className="bg-white border border-slate-500 hover:bg-slate-50/50 transition-all duration-300 py-5 px-2 flex flex-col items-center justify-center text-center cursor-pointer">
              <ReportsIcon />
              <span className="text-[11px] font-bold text-slate-700 mt-2 leading-tight">Reports</span>
            </div>

            {/* Apartment */}
            <div className="bg-white border border-slate-500 hover:bg-slate-50/50 transition-all duration-300 py-5 px-2 flex flex-col items-center justify-center text-center cursor-pointer">
              <ApartmentIcon />
              <span className="text-[11px] font-bold text-slate-700 mt-2 leading-tight">Apartment</span>
            </div>

            {/* Other Services */}
            <div className="bg-white border border-slate-500 hover:bg-slate-50/50 transition-all duration-300 py-5 px-2 flex flex-col items-center justify-center text-center cursor-pointer">
              <ShareIcon />
              <span className="text-[11px] font-bold text-slate-700 mt-2 leading-tight">Other Services</span>
            </div>

          </div>
          <div className="p-6 bg-white border-t border-slate-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">

              {/* Left Side: Summary Cards row and Calculator/Announcements row underneath (2/3 viewport width) */}
              <div className="lg:col-span-2 flex flex-col gap-8 items-stretch">

                {/* 3 summary cards aligned horizontally */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

                  {/* Payment Summary [INR] */}
                  <div className="bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-slate-700/50 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[190px]">
                    {/* Wavy Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.08] pointer-events-none z-0">
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full stroke-white stroke-[0.5] fill-none">
                        <path d="M0,30 Q25,10 50,30 T100,30" />
                        <path d="M0,45 Q25,25 50,45 T100,45" />
                        <path d="M0,60 Q25,40 50,60 T100,60" />
                      </svg>
                    </div>

                    <div className="mb-4 relative z-10">
                      <span className="text-[11px] font-black uppercase tracking-wider text-white">Payment Summary [INR]</span>
                    </div>

                    <div className="space-y-3 relative z-10">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Confirmed Amount</span>
                        <span className="text-xs font-bold text-white">₹{inrSummary.confirmed.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Approved Amount</span>
                        <span className="text-xs font-bold text-white">₹{inrSummary.approved.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pending Amount</span>
                        <span className="text-xs font-bold text-white">₹{inrSummary.pending.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Summary [AED] */}
                  <div className="bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-slate-700/50 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[190px]">
                    {/* Wavy Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.08] pointer-events-none z-0">
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full stroke-white stroke-[0.5] fill-none">
                        <path d="M0,30 Q25,10 50,30 T100,30" />
                        <path d="M0,45 Q25,25 50,45 T100,45" />
                        <path d="M0,60 Q25,40 50,60 T100,60" />
                      </svg>
                    </div>

                    <div className="mb-4 relative z-10">
                      <span className="text-[11px] font-black uppercase tracking-wider text-white">Payment Summary [AED]</span>
                    </div>

                    <div className="space-y-3 relative z-10">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Collection Amount</span>
                        <span className="text-xs font-bold text-white">AED {aedSummary.confirmed.toLocaleString('en-US')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Agent Payable</span>
                        <span className="text-xs font-bold text-white">AED {aedSummary.approved.toLocaleString('en-US')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Agent Receivable</span>
                        <span className="text-xs font-bold text-white">AED {aedSummary.pending.toLocaleString('en-US')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Servicer By Hand [INR] */}
                  <div className="bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-slate-700/50 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[190px]">
                    {/* Wavy Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.08] pointer-events-none z-0">
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full stroke-white stroke-[0.5] fill-none">
                        <path d="M0,30 Q25,10 50,30 T100,30" />
                        <path d="M0,45 Q25,25 50,45 T100,45" />
                        <path d="M0,60 Q25,40 50,60 T100,60" />
                      </svg>
                    </div>

                    <div className="mb-4 relative z-10">
                      <span className="text-[11px] font-black uppercase tracking-wider text-white">Servicer By Hand [INR]</span>
                    </div>

                    <div className="space-y-3 relative z-10">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Hand Amount</span>
                        <span className="text-xs font-bold text-white">₹{handSummary.confirmed.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Row 2: Currency Calculator and Announcements Side-By-Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

                  {/* Currency Calculator Card */}
                  <div className="bg-[#e2e8f0]/40 border border-slate-200/80 rounded-2xl shadow-sm p-6 flex flex-col justify-between relative overflow-hidden min-h-[300px]">
                    <div>
                      <h3 className="text-base font-black text-slate-800 tracking-wide">Currency Calculator</h3>
                      <p className="text-[11px] text-slate-400 font-semibold mt-1">Quick and easy conversions</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                      <div className="flex flex-col gap-6">
                        {/* AED */}
                        <div className="flex items-center justify-between border-2 border-slate-850 rounded-full px-4 py-2.5 bg-white shadow-sm h-11">
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">AED</span>
                          <input
                            type="number"
                            value={calcAed}
                            onChange={(e) => setCalcAed(e.target.value)}
                            className="w-20 text-right bg-transparent border-none outline-none font-bold text-slate-800 placeholder:text-slate-350"
                            placeholder="0.00"
                          />
                        </div>

                        {/* SALE RATE */}
                        <div className="flex items-center justify-between border-2 border-slate-850 rounded-full px-4 py-2.5 bg-white shadow-sm h-11">
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Sale Rate</span>
                          <input
                            type="number"
                            value={calcSaleRate}
                            onChange={(e) => setCalcSaleRate(e.target.value)}
                            className="w-20 text-right bg-transparent border-none outline-none font-bold text-slate-800 placeholder:text-slate-350"
                            placeholder="0.00"
                          />
                        </div>

                        {/* INR */}
                        <div className="flex items-center justify-between border-2 border-slate-850 rounded-full px-4 py-2.5 bg-white shadow-sm h-11">
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">INR</span>
                          <span className="font-extrabold text-slate-900 text-xs">{formattedInr || '0.00'}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3.5 justify-center">
                        {/* COST RATE */}
                        <div className="flex items-center justify-between border-2 border-slate-850 rounded-full px-4 py-2.5 bg-white shadow-sm h-11">
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Cost Rate</span>
                          <input
                            type="number"
                            value={calcCostRate}
                            onChange={(e) => setCalcCostRate(e.target.value)}
                            className="w-20 text-right bg-transparent border-none outline-none font-bold text-slate-800 placeholder:text-slate-350"
                            placeholder="0.00"
                          />
                        </div>

                        {/* PROFIT */}
                        <div className="flex items-center justify-between border-2 border-slate-850 rounded-full px-4 py-2.5 bg-white shadow-sm h-11">
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Profit</span>
                          <span className="font-extrabold text-slate-900 text-xs">{formattedProfit || '0.00'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Announcements Card */}
                  <div className="bg-[#e2e8f0]/40 border border-slate-200/80 rounded-2xl shadow-sm p-6 flex flex-col justify-between relative overflow-hidden min-h-[300px]">
                    {/* Megaphone Outline Icon in the bottom-right corner */}
                    <div className="absolute bottom-6 right-6 text-slate-300 pointer-events-none opacity-40 z-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.58.2-3.11.589-4.59m3.102 9.18c.25.962.578 1.892.977 2.783.244.55.057 1.21-.46 1.511l-.653.38c-.546.318-1.25.117-1.514-.461a20.73 20.73 0 01-1.428-4.282m3.055.069A18.003 18.003 0 0012 15.75c1.9 0 3.722-.29 5.433-.828m-5.433-5.736A18.003 18.003 0 0112 8.25c1.9 0 3.722.29 5.433.828m0 0A17.99 17.99 0 0118 12c0 .975-.077 1.932-.228 2.868m0 0a22.56 22.56 0 01-4.708 1.06m4.708-1.06l3.01 1.737c.566.327 1.22-.096 1.22-.756v-7.662c0-.66-.653-1.083-1.22-.756l-3.01 1.737m-3.01 3.708a22.56 22.56 0 00-4.708-1.06" />
                      </svg>
                    </div>

                    <div className="w-full relative z-10 flex flex-col h-full">
                      <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#16335f]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.58.2-3.11.589-4.59m3.102 9.18c.25.962.578 1.892.977 2.783.244.55.057 1.21-.46 1.511l-.653.38c-.546.318-1.25.117-1.514-.461a20.73 20.73 0 01-1.428-4.282m3.055.069A18.003 18.003 0 0012 15.75c1.9 0 3.722-.29 5.433-.828m-5.433-5.736A18.003 18.003 0 0112 8.25c1.9 0 3.722.29 5.433.828m0 0A17.99 17.99 0 0118 12c0 .975-.077 1.932-.228 2.868m0 0a22.56 22.56 0 01-4.708 1.06m4.708-1.06l3.01 1.737c.566.327 1.22-.096 1.22-.756v-7.662c0-.66-.653-1.083-1.22-.756l-3.01 1.737m-3.01 3.708a22.56 22.56 0 00-4.708-1.06" />
                        </svg>
                        Announcements
                      </h4>
                      <div className="h-px bg-slate-200 w-full mt-3.5" />

                      <div className="flex-1 flex flex-col gap-3.5 mt-5 overflow-y-auto pr-1">
                        {/* Announcement Item 1 */}
                        <div className="flex items-start gap-3 text-left">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-[11px] font-bold text-slate-800 leading-tight block">Scheduled System Maintenance</span>
                            <span className="text-[9.5px] text-slate-500 font-semibold leading-normal block">Sunday, Aug 24 (02:00 - 04:00 UTC). brief disruptions expected.</span>
                          </div>
                        </div>

                        <div className="h-px bg-slate-200/50 w-full" />

                        {/* Announcement Item 2 */}
                        <div className="flex items-start gap-3 text-left">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-[11px] font-bold text-slate-800 leading-tight block">Head Office Audit Module Active</span>
                            <span className="text-[9.5px] text-slate-500 font-semibold leading-normal block">The new HO Account auditing and ledger verification tools are now active.</span>
                          </div>
                        </div>

                        <div className="h-px bg-slate-200/50 w-full" />

                        {/* Announcement Item 3 */}
                        <div className="flex items-start gap-3 text-left">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-[11px] font-bold text-slate-800 leading-tight block">Enhanced Security Protocols</span>
                            <span className="text-[9.5px] text-slate-500 font-semibold leading-normal block">2FA tokens are now strictly required for high-value branch operations.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Side: 6 Redesigned Action Cards Grid (1/3 viewport width) */}
              <div className="lg:col-span-1 grid grid-cols-2 gap-3 max-w-[280px] mx-auto">

                {/* View or Download Statement */}
                <div className="relative bg-[#16335f] text-white p-4 py-3 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#122b52] transition duration-200 h-[130px] w-[130px] justify-self-center">
                  <h4 className="text-[10px] font-black leading-tight max-w-[95%]">View or Download Statement</h4>
                  <div className="w-11 h-11 border border-white/20 bg-white/5 rounded-xl flex items-center justify-center text-white mt-3 relative">
                    <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <div className="absolute bottom-1 right-1 w-3 h-3 bg-white text-[#16335f] flex items-center justify-center text-[7px] font-black rounded-full shadow-sm">!</div>
                  </div>
                </div>

                {/* File Upload */}
                <div className="relative bg-[#16335f] text-white p-4 py-3 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#122b52] transition duration-200 h-[130px] w-[130px] justify-self-center">
                  <h4 className="text-[10px] font-black leading-tight max-w-[95%]">File Upload</h4>
                  <div className="w-11 h-11 border border-white/20 bg-white/5 rounded-xl flex items-center justify-center text-white mt-3">
                    <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9zM9 10.5h6m-6 3h6m-6 3h6" />
                    </svg>
                  </div>
                </div>

                {/* Funds Transfer */}
                <div className="relative bg-[#16335f] text-white p-4 py-3 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#122b52] transition duration-200 h-[130px] w-[130px] justify-self-center">
                  <h4 className="text-[10px] font-black leading-tight max-w-[95%]">Funds Transfer</h4>
                  <div className="w-11 h-11 border border-white/20 bg-white/5 rounded-xl flex items-center justify-center text-white mt-3">
                    <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5M9 7.5h6m-6 3h6m-6 3h3" />
                    </svg>
                  </div>
                </div>

                {/* Card 4 Empty */}
                <div className="bg-[#16335f] rounded-2xl shadow-sm h-[130px] w-[130px] justify-self-center" />

                {/* Card 5 Empty */}
                <div className="bg-[#16335f] rounded-2xl shadow-sm h-[130px] w-[130px] justify-self-center" />

                {/* Card 6 Empty */}
                <div className="bg-[#16335f] rounded-2xl shadow-sm h-[130px] w-[130px] justify-self-center" />

              </div>
            </div>
          </div>

        </main>
      </div>

      {/* Footer Info shifted to match main offset */}
      <footer className={`border-t border-slate-200 bg-white py-8 transition-all duration-300 ${sidebarExpanded ? 'pl-64' : 'pl-0'}`}>
        <div className="w-full text-center text-xs text-slate-500 space-y-2">
          <p>&copy; {new Date().getFullYear()} Infazys Finacle Systems. All simulation rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
