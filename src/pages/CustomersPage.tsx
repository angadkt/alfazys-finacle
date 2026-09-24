import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/alfazys-logo-nobg.png';
import { dbService } from '../services/db';
import type { Customer } from '../services/db';
import CustomerTable from '../components/CustomerTable';
import AddCustomerModal from '../components/AddCustomerModal';
import { useToast } from '../contexts/ToastContext';

// Sidebar Icons
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
  <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
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

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4.5 h-4.5 text-slate-600 flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
  </svg>
);

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

const BellIcon = ({ className = "w-5.5 h-5.5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
  </svg>
);


export default function CustomersPage() {
  const navigate = useNavigate();
  const toast = useToast();

  // Active Role & User Session derived strictly from login credentials
  const activeRole = dbService.getUserRole();
  const currentUser = dbService.getUser();
  const isAdmin = activeRole === 'super_admin';

  // Navigation / UI States
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem('infazys_finacle_sidebar_expanded');
    return saved !== null ? JSON.parse(saved) : true;
  });

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

  // Customers Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [activeTab, setActiveTab] = useState<'customers' | 'requests'>('customers');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

  const reloadCustomers = () => {
    setCustomers(dbService.getCustomers());
  };

  useEffect(() => {
    reloadCustomers();
  }, []);


  // Counts
  const totalCount = customers.filter(c => c && c.status !== 'pending').length;
  const pendingCount = customers.filter(c => c && c.status === 'pending').length;

  // Pending Requests (Separate Section)
  const pendingCustomers = customers.filter(c => {
    if (!c || c.status !== 'pending') return false;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (c.name || '').toLowerCase().includes(query) ||
      (c.email || '').toLowerCase().includes(query) ||
      (c.phone || '').includes(query) ||
      (c.city || '').toLowerCase().includes(query) ||
      (c.emirates || c.country || '').toLowerCase().includes(query)
    );
  });

  // Filtered List for Main Registry (Excludes Pending)
  const filteredCustomers = customers.filter(c => {
    if (!c || c.status === 'pending') return false;

    // 1. Filter by status
    if (statusFilter !== 'all' && c.status !== statusFilter) {
      return false;
    }

    // 2. Filter by search query
    const name = c.name || '';
    const email = c.email || '';
    const phone = c.phone || '';
    const city = c.city || '';
    const emirates = c.emirates || c.country || '';
    const query = searchQuery.toLowerCase().trim();

    if (!query) return true;

    return (
      name.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query) ||
      phone.includes(query) ||
      city.toLowerCase().includes(query) ||
      emirates.toLowerCase().includes(query)
    );
  });

  // Admin Quick Inline Actions
  const handleQuickApprove = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    dbService.updateCustomer(id, { status: 'approved' });
    reloadCustomers();
    toast.success(`Customer "${name}" approved successfully!`);
  };

  const handleQuickReject = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    dbService.updateCustomer(id, { status: 'rejected' });
    reloadCustomers();
    toast.error(`Customer "${name}" has been rejected.`);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased selection:bg-[#9e0148]/10 selection:text-[#9e0148]">
      
      {/* Premium Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#9e0148] shadow-[0_2px_15px_rgba(0,0,0,0.08)]">
        <div className="w-full h-20 flex items-center justify-between px-5 relative">
          
          {/* Logo Brand */}
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
          <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm xl:max-w-md px-4 z-20">
            <div className="flex items-center gap-3 bg-white/15 border border-white/25 rounded-2xl px-4 py-2 h-11 transition-all duration-200 focus-within:bg-white/20 focus-within:border-white/40">
              <SearchIcon />
              <input 
                type="text" 
                placeholder="Search customers by name, country..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                className="w-11 h-11 object-cover rounded-full border-2 border-white/40 shadow-sm"
              />
              <div className="flex flex-col text-left justify-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white leading-tight">
                    {currentUser.name}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                    isAdmin ? 'bg-amber-400 text-slate-950' : 'bg-white/25 text-white'
                  }`}>
                    {isAdmin ? 'Admin' : activeRole === 'staff' ? 'Staff' : 'Agent'}
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
        
        {/* Collapsible Sidebar - Clean standard Core Banking menu */}
        <aside className={`fixed left-0 top-20 bottom-0 bg-white z-30 transition-all duration-300 overflow-hidden flex flex-col justify-between ${sidebarExpanded ? 'w-64 border-r border-slate-100 shadow-2xl py-6' : 'w-0 border-none py-0'}`}>
          <nav className="flex-1 overflow-y-auto space-y-3 px-3 scrollbar-none">
            
            {/* DASHBOARD */}
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

            {/* CUSTOMERS - ACTIVE */}
            <div 
              onClick={() => navigate('/customers')}
              className="flex items-center h-16 px-3 transition bg-[#9e0248]/5 border-r-4 border-[#9e0248] cursor-pointer"
            >
              <span className="flex-shrink-0 bg-[#9e0248] text-white p-2 rounded-2xl flex items-center justify-center">
                <CustomersIcon />
              </span>
              <div className={`ml-4 flex items-center justify-between flex-1 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap text-[#9e0248]">
                  CUSTOMERS
                </span>
                {isAdmin && pendingCount > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </div>
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

          </nav>
        </aside>

        {/* Main Content Workspace Container */}
        <main className={`flex-1 min-h-screen bg-slate-50/50 pt-6 pb-6 pr-6 lg:pt-8 lg:pb-8 lg:pr-8 transition-all duration-300 ${sidebarExpanded ? 'pl-72' : 'pl-6'}`}>
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Breadcrumb & Header Container */}
            <div className="flex flex-col gap-6 mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Home</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                <span className="text-[#9e0248]">Customers</span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none font-montserrat">
                    Customers
                  </h1>
                  <p className="text-sm text-slate-500 font-semibold tracking-wide mt-2">
                    Manage customer profiles, verification and customer information.
                  </p>
                </div>
                
                {/* Add Customer Button */}
                <button 
                  onClick={() => setIsAddCustomerModalOpen(true)}
                  className="bg-[#9e0248] hover:bg-[#85013c] text-white shadow-md shadow-[#9e0248]/10 hover:shadow-[#9e0248]/20 transition duration-200 py-2.5 px-4 font-bold flex items-center gap-2 text-xs uppercase tracking-wider rounded-md cursor-pointer whitespace-nowrap h-fit"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>Add Customer</span>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-8 border-b border-slate-200 w-full mt-2">
                <button 
                  onClick={() => setActiveTab('customers')}
                  className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'customers' ? 'text-[#9e0248]' : 'text-slate-500 hover:text-slate-700'} cursor-pointer flex items-center gap-2`}
                >
                  Customers ({totalCount})
                  {activeTab === 'customers' && (
                    <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#9e0248] rounded-t-full" />
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('requests')}
                  className={`pb-3 text-sm font-bold transition-colors relative flex items-center gap-2 ${activeTab === 'requests' ? 'text-[#9e0248]' : 'text-slate-500 hover:text-slate-700'} cursor-pointer`}
                >
                  Requests ({pendingCount})
                  {activeTab === 'requests' && (
                    <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#9e0248] rounded-t-full" />
                  )}
                </button>
              </div>
            </div>

            {/* Content Area Based on Active Tab */}
            {activeTab === 'requests' ? (
              <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden flex flex-col mb-6">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="flex flex-col">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      Customer Requests
                    </h2>
                    <p className="text-xs font-semibold text-slate-500 mt-1">Review and process new customer registration requests.</p>
                  </div>
                  <span className="text-xs font-black text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200 flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    {pendingCount} Pending
                  </span>
                </div>
                <CustomerTable 
                  customers={pendingCustomers}
                  isAdmin={isAdmin}
                  onApprove={handleQuickApprove}
                  onReject={handleQuickReject}
                />
              </div>
            ) : (
              <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden flex flex-col">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Search Input */}
                  <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-md px-3 py-2 h-10 w-full lg:max-w-xs transition focus-within:shadow-[0_0_0_2px_rgba(158,2,72,0.1)] focus-within:border-[#9e0248]">
                    <SearchIcon />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400 font-semibold"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-2 flex-wrap select-none">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-2">Status:</span>
                    
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                        statusFilter === 'all'
                          ? 'bg-[#9e0248]/10 text-[#9e0248]'
                          : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span>All</span>
                    </button>

                    <button
                      onClick={() => setStatusFilter('approved')}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                        statusFilter === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'approved' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span>Approved</span>
                    </button>

                    <button
                      onClick={() => setStatusFilter('rejected')}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                        statusFilter === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'rejected' ? 'bg-rose-500' : 'bg-slate-300'}`} />
                      <span>Rejected</span>
                    </button>
                    
                    <button className="px-2 py-1.5 ml-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer border border-transparent">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <CustomerTable 
                  customers={filteredCustomers}
                  isAdmin={isAdmin}
                  onApprove={handleQuickApprove}
                  onReject={handleQuickReject}
                />
              </div>
            )}
            
          </div>
        </main>

      </div>

      {/* Footer Info */}
      <footer className={`border-t border-slate-200 bg-white py-6 transition-all duration-300 ${sidebarExpanded ? 'pl-64' : 'pl-0'}`}>
        <div className="w-full text-center text-xs text-slate-500 space-y-1">
          <p>&copy; {new Date().getFullYear()} Infazys Finacle Systems. Universal Banking Solution.</p>
        </div>
      </footer>

      <AddCustomerModal 
        isOpen={isAddCustomerModalOpen} 
        onClose={() => setIsAddCustomerModalOpen(false)} 
        onSuccess={() => { 
          reloadCustomers(); 
        }} 
      />
    </div>
  );
}
