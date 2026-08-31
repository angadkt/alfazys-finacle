import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/alfazys-logo-nobg.png';
import { dbService } from '../services/db';
import type { Customer } from '../services/db';
import { useToast } from '../contexts/ToastContext';

// Custom Icons for Sidebar & Table actions
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
    className="w-6 h-6 text-white cursor-pointer hover:text-white/80 transition"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const BellIcon = ({ className = "w-5.5 h-5.5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const DashboardIcon = () => (
  <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const CustomersIcon = () => (
  <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A2.25 2.25 0 0112.75 21.5h-1.5a2.25 2.25 0 01-2.25-2.263V19.13m5.75-.002a9.397 9.397 0 01-2.17.283 9.4 9.4 0 01-2.17-.283M8.25 19.128a9.38 9.38 0 01-2.625.372 9.337 9.337 0 01-4.121-.952 4.125 4.125 0 017.533-2.493M8.25 19.128v-.003c0-1.113.285-2.16.786-3.07M12 18.75c-3.12 0-5.84-1.632-7.38-4.088A9.37 9.37 0 0112 12.75c3.12 0 5.84 1.632 7.38 4.088A9.37 9.37 0 0112 18.75z" />
  </svg>
);

const AdminPanelIcon = () => (
  <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const PowerIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5.5 h-5.5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const AgentsIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5.5 h-5.5">
 <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
 </svg>
);

const LoansSidebarIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5.5 h-5.5">
 <path strokeLinecap="round" strokeLinejoin="round" d="M21 12V8.4a2.4 2.4 0 0 0-2.4-2.4H4.8A2.4 2.4 0 0 0 2.4 8.4v7.2a2.4 2.4 0 0 0 2.4 2.4h13.8a2.4 2.4 0 0 0 2.4-2.4V14m0-2h-3.6a1.8 1.8 0 1 1 0-3.6H21" />
 </svg>
);

const AedCollectionIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5.5 h-5.5">
 <circle cx="9" cy="12" r="5.5" />
 <circle cx="15" cy="12" r="5.5" />
 </svg>
);

const OfficeAccountsIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5.5 h-5.5">
 <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18" />
 </svg>
);

const KycPanelIcon = () => (
  <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const BusinessHealthIcon = () => (
  <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18a.75.75 0 00-.75.75v3c0 .414.336.75.75.75h3a.75.75 0 00.75-.75v-3a.75.75 0 00-.75-.75h-3zM9 10.5a.75.75 0 00-.75.75v11.25c0 .414.336.75.75.75h3a.75.75 0 00.75-.75V11.25a.75.75 0 00-.75-.75H9zM15.75 3a.75.75 0 00-.75.75v18.75c0 .414.336.75.75.75h3a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-3z" />
  </svg>
);

const AuditLogsIcon = () => (
  <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const getInitials = (name: string) => {
  const val = name || 'Anonymous';
  return val.split(' ').map(n => n[0] || '').join('').substring(0, 2).toUpperCase();
};

export default function AdminPanelPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingGuard, setLoadingGuard] = useState(true);

  // Layout UI States
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('infazys_finacle_sidebar_expanded');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const currentUser = dbService.getUser() || {
    name: "Sarah Al-Fayed",
    email: "sarah.alfayed@finacle.io",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
    occupation: "Principal Financial Consultant (Super Admin)",
    joinedDate: "2024-03-12"
  };
  const loginTime = (() => {
    return localStorage.getItem('infazys_finacle_login_time') || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  })();

  const toggleSidebar = () => {
    setSidebarExpanded(prev => {
      const newVal = !prev;
      localStorage.setItem('infazys_finacle_sidebar_expanded', JSON.stringify(newVal));
      return newVal;
    });
  };

  // Customers pending verification state
  const [pendingCustomers, setPendingCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');

  // Access Control Guard
  useEffect(() => {
    const role = dbService.getUserRole();
    if (role !== 'super_admin') {
      // Direct access attempt block
      navigate('/dashboard');
    } else {
      setIsAdmin(true);
      setLoadingGuard(false);
      // Load pending customers
      loadPending();
    }
  }, [navigate]);

  const loadPending = () => {
    try {
      const all = dbService.getCustomers();
      if (all && Array.isArray(all)) {
        const filtered = all.filter(c => c && c.status === 'pending');
        setPendingCustomers(filtered);
      } else {
        setPendingCustomers([]);
      }
    } catch (e) {
      console.error('Failed to load pending customers', e);
      setPendingCustomers([]);
    }
  };

  const handleApprove = (id: string, name: string) => {
    const db = dbService.getDb();
    const updated = db.customers.map(c => {
      if (c.id === id) {
        return { ...c, status: 'approved' as const };
      }
      return c;
    });
    db.customers = updated;
    localStorage.setItem('infazys_finacle_db', JSON.stringify(db));
    
    // Feedback Notice
    setMessage(`Customer Code for "${name}" has been APPROVED successfully!`);
    toast.success(`Customer "${name}" approved successfully!`);
    loadPending();
    setTimeout(() => setMessage(''), 4000);
  };

  const handleReject = (id: string, name: string) => {
    const db = dbService.getDb();
    const updated = db.customers.map(c => {
      if (c.id === id) {
        return { ...c, status: 'rejected' as const };
      }
      return c;
    });
    db.customers = updated;
    localStorage.setItem('infazys_finacle_db', JSON.stringify(db));

    // Feedback Notice
    setMessage(`Customer Code for "${name}" has been REJECTED!`);
    toast.error(`Customer "${name}" has been rejected.`);
    loadPending();
    setTimeout(() => setMessage(''), 4000);
  };
  const filteredCustomers = pendingCustomers.filter(cust => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      (cust.name && cust.name.toLowerCase().includes(term)) ||
      (cust.email && cust.email.toLowerCase().includes(term)) ||
      (cust.emirates && cust.emirates.toLowerCase().includes(term)) ||
      (cust.city && cust.city.toLowerCase().includes(term))
    );
  });
  if (loadingGuard || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-[#9e0148] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500">Checking credentials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased selection:bg-[#9e0148]/10 selection:text-[#9e0148]">
      
      {/* Header Banner Section */}
      <header className="sticky top-0 z-40 bg-[#9e0248] shadow-[0_2px_15px_rgba(0,0,0,0.08)]">
        <div className="w-full h-20 flex items-center justify-between px-5 relative">
          
          {/* Logo brand title layout */}
          <div className="flex items-center text-white select-none">
            <MenuIcon onClick={toggleSidebar} />
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
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm lg:max-w-md px-4 z-20">
            <div className="flex items-center gap-3 bg-white/15 border border-white/25 rounded-2xl px-4 py-2 h-11 transition-all duration-200 focus-within:bg-white/20 focus-within:border-white/40">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search pending registrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm text-white placeholder:text-white/60 font-semibold"
              />
            </div>
          </div>

          {/* Right Actions Menu */}
          <div className="flex items-center gap-6 relative z-10 text-white">

            {/* User Session Info */}
            <div className="flex items-center gap-4 select-none">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/30 shadow-sm"
              />
              <div className="flex flex-col text-left justify-center">
                <span className="text-sm font-bold text-white leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-xs text-white/70 font-semibold mt-1 leading-tight block">
                  Last login: {loginTime}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-white/25" />

            {/* Notification & Logout */}
            <div className="flex items-center gap-5">
              <BellIcon className="w-5.5 h-5.5 text-white cursor-pointer hover:text-white/80 transition" />

              <button
                onClick={() => navigate('/')}
                className="group relative text-white hover:text-white/80 transition cursor-pointer flex items-center justify-center"
              >
                <PowerIcon className="w-5.5 h-5.5 text-white" />
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* Grid Layout Container */}
      <div className="flex flex-1 relative">
        
        {/* Sidebar Panel */}
        <aside 
          className={`fixed top-20 bottom-0 left-0 bg-white border-r border-slate-100 flex flex-col justify-between pt-6 pb-6 px-3 z-30 transition-all duration-300 ${sidebarExpanded ? 'w-64' : 'w-16'}`}
        >
          <nav className="flex flex-col gap-2">
            
            {/* Dashboard Link */}
            <div 
              onClick={() => navigate('/dashboard')}
              className="flex items-center h-16 px-3 rounded-2xl transition hover:bg-slate-50 group/item cursor-pointer"
            >
              <span className="flex-shrink-0 bg-[#f0f7ff] text-[#2563eb] p-2 rounded-2xl flex items-center justify-center group-hover/item:bg-blue-100/50 transition">
                <DashboardIcon />
              </span>
              <span className={`ml-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-[#1e293b] group-hover/item:text-[#2563eb] transition-all duration-200 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                DASHBOARD
              </span>
            </div>

            {/* Customers Link */}
            <div 
              onClick={() => navigate('/customers')}
              className="flex items-center h-16 px-3 rounded-2xl transition hover:bg-slate-50 group/item cursor-pointer"
            >
              <span className="flex-shrink-0 bg-[#f0f7ff] text-[#2563eb] p-2 rounded-2xl flex items-center justify-center group-hover/item:bg-blue-100/50 transition">
                <CustomersIcon />
              </span>
              <span className={`ml-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-[#1e293b] group-hover/item:text-[#2563eb] transition-all duration-200 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                CUSTOMERS
              </span>
              <span className={`ml-auto text-[#2563eb] transition-opacity duration-200 flex ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <ChevronRightIcon />
              </span>
            </div>

            {/* AGENTS */}
            <div className="flex items-center h-16 px-3 transition hover:bg-slate-50 group/item opacity-50 cursor-not-allowed">
              <span className="flex-shrink-0 bg-[#f0f7ff] text-[#2563eb] p-2 rounded-2xl flex items-center justify-center">
                <AgentsIcon />
              </span>
              <span className={`ml-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-[#1e293b] ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                AGENTS
              </span>
              <span className={`ml-auto text-[#2563eb] flex ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <ChevronRightIcon />
              </span>
            </div>

            {/* LOANS */}
            <div className="flex items-center h-16 px-3 transition hover:bg-slate-50 group/item opacity-50 cursor-not-allowed">
              <span className="flex-shrink-0 bg-[#f0f7ff] text-[#2563eb] p-2 rounded-2xl flex items-center justify-center">
                <LoansSidebarIcon />
              </span>
              <span className={`ml-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-[#1e293b] ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                LOANS
              </span>
              <span className={`ml-auto text-[#2563eb] flex ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <ChevronRightIcon />
              </span>
            </div>

            {/* AED COLLECTION */}
            <div className="flex items-center h-16 px-3 transition hover:bg-slate-50 group/item opacity-50 cursor-not-allowed">
              <span className="flex-shrink-0 bg-[#f0f7ff] text-[#2563eb] p-2 rounded-2xl flex items-center justify-center">
                <AedCollectionIcon />
              </span>
              <span className={`ml-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-[#1e293b] ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                AED COLLECTION
              </span>
              <span className={`ml-auto text-[#2563eb] flex ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <ChevronRightIcon />
              </span>
            </div>

            {/* OFFICE ACCOUNTS */}
            <div className="flex items-center h-16 px-3 transition hover:bg-slate-50 group/item opacity-50 cursor-not-allowed">
              <span className="flex-shrink-0 bg-[#f0f7ff] text-[#2563eb] p-2 rounded-2xl flex items-center justify-center">
                <OfficeAccountsIcon />
              </span>
              <span className={`ml-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-[#1e293b] ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                OFFICE ACCOUNTS
              </span>
              <span className={`ml-auto text-[#2563eb] flex ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <ChevronRightIcon />
              </span>
            </div>

            {/* KYC PANEL */}
            <div className="flex items-center h-16 px-3 transition hover:bg-slate-50 group/item opacity-50 cursor-not-allowed">
              <span className="flex-shrink-0 bg-[#f0f7ff] text-[#2563eb] p-2 rounded-2xl flex items-center justify-center">
                <KycPanelIcon />
              </span>
              <span className={`ml-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-[#1e293b] ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                KYC PANEL
              </span>
              <span className={`ml-auto text-[#2563eb] flex ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <ChevronRightIcon />
              </span>
            </div>

            {/* BUSINESS HEALTH */}
            <div className="flex items-center h-16 px-3 transition hover:bg-slate-50 group/item opacity-50 cursor-not-allowed">
              <span className="flex-shrink-0 bg-[#f0f7ff] text-[#2563eb] p-2 rounded-2xl flex items-center justify-center">
                <BusinessHealthIcon />
              </span>
              <span className={`ml-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-[#1e293b] ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                BUSINESS HEALTH
              </span>
              <span className={`ml-auto text-[#2563eb] flex ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <ChevronRightIcon />
              </span>
            </div>

            {/* AUDIT LOGS */}
            <div className="flex items-center h-16 px-3 transition hover:bg-slate-50 group/item opacity-50 cursor-not-allowed">
              <span className="flex-shrink-0 bg-[#f0f7ff] text-[#2563eb] p-2 rounded-2xl flex items-center justify-center">
                <AuditLogsIcon />
              </span>
              <span className={`ml-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-[#1e293b] ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                AUDIT LOGS
              </span>
              <span className={`ml-auto text-[#2563eb] flex ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <ChevronRightIcon />
              </span>
            </div>

            {/* Admin Panel (Active state) */}
            <div 
              className="flex items-center h-16 px-3 transition bg-[#9e0148]/5 border-r-4 border-[#9e0148] cursor-pointer"
            >
              <span className="flex-shrink-0 bg-[#9e0148] text-white p-2 rounded-2xl flex items-center justify-center">
                <AdminPanelIcon />
              </span>
              <span className={`ml-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-[#9e0148] transition-opacity duration-200 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                ADMIN PANEL
              </span>
            </div>

          </nav>
        </aside>

        {/* Main Content Pane */}
        <main className={`flex-1 min-h-screen bg-slate-50/50 pt-6 pb-6 pr-6 lg:pt-8 lg:pb-8 lg:pr-8 transition-all duration-300 ${sidebarExpanded ? 'pl-72' : 'pl-6'}`}>
          <div className="max-w-7xl mx-auto space-y-7">
            
            {/* Title Header */}
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Admin Verification Queue</h1>
              <p className="text-xs text-slate-450 font-bold tracking-wide mt-2">Verify, approve, or reject customer registrations submitted by staff</p>
            </div>

            {/* Notification Bar */}
            {message && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-4 py-3 rounded-xl text-xs flex items-center animate-in fade-in slide-in-from-top-2 duration-200">
                <svg className="w-4.5 h-4.5 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {message}
              </div>
            )}

            {/* Verification Queue List Table */}
            <div className="bg-white border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.02)] rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#9e0148]/5 border-b border-[#9e0148]/10">
                      <th className="text-slate-500 text-[10px] uppercase font-black tracking-wider py-4 px-6">Customer Name</th>
                      <th className="text-slate-500 text-[10px] uppercase font-black tracking-wider py-4 px-6">Short Name</th>
                      <th className="text-slate-500 text-[10px] uppercase font-black tracking-wider py-4 px-6">Phone Number</th>
                      <th className="text-slate-500 text-[10px] uppercase font-black tracking-wider py-4 px-6">Address & City</th>
                      <th className="text-slate-500 text-[10px] uppercase font-black tracking-wider py-4 px-6">Emirates</th>
                      <th className="text-slate-500 text-[10px] uppercase font-black tracking-wider py-4 px-6">Status</th>
                      <th className="text-slate-500 text-[10px] uppercase font-black tracking-wider py-4 px-6 text-center">Approve / Reject</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((cust) => (
                        <tr 
                          key={cust.id} 
                          onClick={() => navigate(`/admin-panel/customer/${cust.id}`)}
                          className="transition duration-150 border-b border-slate-100 hover:bg-[#9e0148]/3 bg-white last:border-none cursor-pointer"
                        >
                          {/* Avatar initials, name and email */}
                          <td className="py-4.5 px-6">
                            <div className="flex items-center gap-3.5">
                              <div className="text-[#9e0148] bg-[#9e0148]/10 border border-[#9e0148]/20 w-9 h-9 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 rounded-full">
                                {getInitials(cust.name)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-800 leading-tight">{cust.name}</span>
                                <span className="text-[10px] text-slate-450 font-bold mt-1">{cust.email}</span>
                              </div>
                            </div>
                          </td>

                          {/* Short Name */}
                          <td className="py-4.5 px-6">
                            <span className="text-xs font-semibold text-slate-650">{cust.shortName || '-'}</span>
                          </td>

                          {/* Phone */}
                          <td className="py-4.5 px-6">
                            <span className="text-xs font-semibold text-slate-600">{cust.phone}</span>
                          </td>

                          {/* Address & City */}
                          <td className="py-4.5 px-6">
                            <span className="text-xs font-semibold text-slate-650">
                              {cust.address ? `${cust.address}, ${cust.city || ''}` : `${cust.city || '-'}`}
                            </span>
                          </td>

                          {/* Emirates */}
                          <td className="py-4.5 px-6">
                            <span className="text-xs font-semibold text-slate-650">{cust.emirates || cust.country}</span>
                          </td>

                          {/* Pending Badge */}
                          <td className="py-4.5 px-6">
                            <span className="inline-flex px-3 py-1 text-[9px] font-black uppercase tracking-wider leading-none rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/15">
                              {cust.status}
                            </span>
                          </td>

                          {/* Action Approve/Reject Buttons */}
                          <td className="py-4.5 px-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-3">
                              {/* Approve Button */}
                              <button 
                                onClick={() => handleApprove(cust.id, cust.name)}
                                title="Approve"
                                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 p-2 rounded-xl border border-emerald-500/15 transition cursor-pointer"
                              >
                                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              </button>

                              {/* Reject Button */}
                              <button 
                                onClick={() => handleReject(cust.id, cust.name)}
                                title="Reject"
                                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 p-2 rounded-xl border border-rose-500/15 transition cursor-pointer"
                              >
                                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 0A48.536 48.536 0 0112 3c1.29 0 2.56.05 3.824.15M9.75 21.75c-3.12 0-5.625-2.505-5.625-5.625V6.108c0-1.135.845-2.098 1.976-2.192a48.424 48.424 0 011.123-.08" />
                            </svg>
                            <span className="text-xs font-black uppercase tracking-wider text-slate-400">All code registrations are verified</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>

      </div>

      {/* Footer Info */}
      <footer className={`border-t border-slate-200 bg-white py-8 transition-all duration-300 ${sidebarExpanded ? 'pl-64' : 'pl-0'}`}>
        <div className="w-full text-center text-xs text-slate-500 space-y-2">
          <p>&copy; {new Date().getFullYear()} Infazys Finacle Systems. All simulation rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
