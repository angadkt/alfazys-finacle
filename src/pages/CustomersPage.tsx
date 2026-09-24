import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/alfazys-logo-nobg.png';
import { dbService } from '../services/db';
import type { Customer } from '../services/db';
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

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const CrossIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const getInitials = (name: string) => {
  const val = name || 'Anonymous';
  return val.split(' ').map(n => n[0] || '').join('').substring(0, 2).toUpperCase();
};

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

  const reloadCustomers = () => {
    setCustomers(dbService.getCustomers());
  };

  useEffect(() => {
    reloadCustomers();
  }, []);


  // Counts
  const totalCount = customers.length;
  const pendingCount = customers.filter(c => c && c.status === 'pending').length;
  const approvedCount = customers.filter(c => c && c.status === 'approved').length;
  const rejectedCount = customers.filter(c => c && c.status === 'rejected').length;

  // Filtered List
  const filteredCustomers = customers.filter(c => {
    if (!c) return false;

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
            
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <span>Home</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
              <span className="text-slate-800">Customers</span>
            </div>

            {/* Header Content Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none font-montserrat">
                    Customers Registry
                  </h1>
                  {isAdmin ? (
                    <span className="bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                      Admin Mode
                    </span>
                  ) : (
                    <span className="bg-[#9e0248]/10 border border-[#9e0248]/20 text-[#9e0248] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                      {activeRole === 'staff' ? 'Staff' : 'Field Agent'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-bold tracking-wide mt-2">
                  {isAdmin 
                    ? 'Review, verify, approve, or reject customer onboarding requests in real-time.' 
                    : 'Manage corporate and individual customer accounts & register new customers.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Pending alert banner for Admin */}
                {isAdmin && pendingCount > 0 && (
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className="bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>{pendingCount} Pending Verification</span>
                  </button>
                )}

                {/* Add Customer Button */}
                <button 
                  onClick={() => navigate('/customers/new')}
                  className="bg-[#9e0248] hover:bg-[#85013c] text-white shadow-md shadow-[#9e0248]/10 hover:shadow-[#9e0248]/20 transition duration-200 py-3 px-5 font-bold flex items-center gap-2 text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>Add Customer</span>
                </button>
              </div>
            </div>

            {/* Unified Data Card */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden flex flex-col">
              {/* Filter & Local Search Toolbar */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Filter Pills */}
                <div className="flex items-center gap-2 flex-wrap select-none">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-2">Filter By:</span>
                  
                  {/* ALL PILL */}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-[#9e0248]/10 text-[#9e0248]'
                        : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span>All</span>
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${statusFilter === 'all' ? 'bg-[#9e0248] text-white' : 'bg-slate-200 text-slate-600'}`}>{totalCount}</span>
                  </button>

                  {/* PENDING PILL */}
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
                      statusFilter === 'pending'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${statusFilter === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-amber-500/50'}`} />
                    <span>Pending</span>
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${statusFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>{pendingCount}</span>
                  </button>

                  {/* APPROVED PILL */}
                  <button
                    onClick={() => setStatusFilter('approved')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
                      statusFilter === 'approved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${statusFilter === 'approved' ? 'bg-emerald-500' : 'bg-emerald-500/50'}`} />
                    <span>Approved</span>
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${statusFilter === 'approved' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>{approvedCount}</span>
                  </button>

                  {/* REJECTED PILL */}
                  <button
                    onClick={() => setStatusFilter('rejected')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
                      statusFilter === 'rejected'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${statusFilter === 'rejected' ? 'bg-rose-500' : 'bg-rose-500/50'}`} />
                    <span>Rejected</span>
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${statusFilter === 'rejected' ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-600'}`}>{rejectedCount}</span>
                  </button>
                </div>

                {/* Local Table Search Input */}
                <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-lg px-4 py-2 h-11 w-full md:max-w-xs transition focus-within:shadow-[0_0_0_2px_rgba(158,2,72,0.1)] focus-within:border-[#9e0248]">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-slate-400 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search registry table..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400 font-semibold"
                  />
                </div>

              </div>

              {/* Customers Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-slate-500 text-[10px] uppercase font-black tracking-widest py-4 px-6">Customer Name</th>
                      <th className="text-slate-500 text-[10px] uppercase font-black tracking-widest py-4 px-6">Short Name</th>
                      <th className="text-slate-500 text-[10px] uppercase font-black tracking-widest py-4 px-6">Phone Number</th>
                      <th className="text-slate-500 text-[10px] uppercase font-black tracking-widest py-4 px-6">Address & City</th>
                      <th className="text-slate-500 text-[10px] uppercase font-black tracking-widest py-4 px-6">Emirates</th>
                      <th className="text-slate-500 text-[10px] uppercase font-black tracking-widest py-4 px-6">Status</th>
                      <th className="text-slate-500 text-[10px] uppercase font-black tracking-widest py-4 px-6 text-center">
                        {isAdmin ? 'Actions & Verification' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((cust) => {
                        const isPending = cust.status === 'pending';
                        return (
                          <tr 
                            key={cust.id} 
                            onClick={() => navigate(`/customers/view/${cust.id}`)}
                            className="transition duration-150 border-b border-slate-100 hover:bg-[#9e0248]/3 bg-white last:border-none cursor-pointer"
                          >
                            
                            {/* Name + Email + Avatar */}
                            <td className="py-4.5 px-6">
                              <div className="flex items-center gap-3.5">
                                <div className="text-[#9e0248] bg-[#9e0248]/10 border border-[#9e0248]/20 w-9 h-9 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 rounded-full">
                                  {getInitials(cust.name)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-slate-800 leading-tight">{cust.name}</span>
                                  <span className="text-[10px] text-slate-400 font-bold mt-1">{cust.email}</span>
                                </div>
                              </div>
                            </td>

                            {/* Short Name */}
                            <td className="py-4.5 px-6">
                              <span className="text-xs font-semibold text-slate-600">{cust.shortName || '-'}</span>
                            </td>

                            {/* Phone */}
                            <td className="py-4.5 px-6">
                              <span className="text-xs font-semibold text-slate-600 tabular-nums font-inter">{cust.phone}</span>
                            </td>

                            {/* Address & City */}
                            <td className="py-4.5 px-6">
                              <span className="text-xs font-semibold text-slate-600">
                                {cust.address ? `${cust.address}, ${cust.city || ''}` : `${cust.city || '-'}`}
                              </span>
                            </td>

                            {/* Emirates */}
                            <td className="py-4.5 px-6">
                              <span className="text-xs font-semibold text-slate-600">{cust.emirates || cust.country}</span>
                            </td>

                            {/* Status Pill Badge */}
                            <td className="py-4.5 px-6">
                              <span className={`inline-flex px-3 py-1 text-[9px] font-black uppercase tracking-wider leading-none rounded-full ${
                                cust.status === 'approved' 
                                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/15' 
                                  : cust.status === 'rejected'
                                  ? 'bg-rose-500/10 text-rose-600 border border-rose-500/15'
                                  : 'bg-amber-500/10 text-amber-600 border border-amber-500/15'
                              }`}>
                                {cust.status}
                              </span>
                            </td>

                            {/* Action Buttons */}
                            <td className="py-4.5 px-6 text-center">
                              <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                
                                {/* If Admin & Pending: Show quick Approve and Reject buttons */}
                                {isAdmin && isPending && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => handleQuickApprove(e, cust.id, cust.name)}
                                      className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200 rounded-lg transition shadow-xs cursor-pointer"
                                      title="Approve Customer"
                                    >
                                      <CheckIcon />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleQuickReject(e, cust.id, cust.name)}
                                      className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 rounded-lg transition shadow-xs cursor-pointer"
                                      title="Reject Customer"
                                    >
                                      <CrossIcon />
                                    </button>
                                  </>
                                )}

                                {/* View / Review Details Button */}
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/customers/view/${cust.id}`);
                                  }}
                                  className="text-slate-400 hover:text-[#9e0248] p-1.5 hover:bg-[#9e0248]/5 rounded-lg transition cursor-pointer"
                                  title={isAdmin && isPending ? "Review & Verify Details" : "View Customer Details"}
                                >
                                  <EyeIcon />
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-24 text-center">
                          <div className="flex flex-col items-center justify-center gap-4">
                            <div className="w-20 h-20 bg-slate-50 flex items-center justify-center rounded-full border border-slate-100">
                              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A2.25 2.25 0 0112.75 21.5h-1.5a2.25 2.25 0 01-2.25-2.263V19.13m5.75-.002a9.397 9.397 0 01-2.17.283 9.4 9.4 0 01-2.17-.283M8.25 19.128a9.38 9.38 0 01-2.625.372 9.337 9.337 0 01-4.121-.952 4.125 4.125 0 017.533-2.493M8.25 19.128v-.003c0-1.113.285-2.16.786-3.07M12 18.75c-3.12 0-5.84-1.632-7.38-4.088A9.37 9.37 0 0112 12.75c3.12 0 5.84 1.532 7.38 4.088A9.37 9.37 0 0112 18.75z" />
                              </svg>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-black text-slate-700">No Customers Found</span>
                              <span className="text-xs text-slate-500 font-medium max-w-xs mt-1">No customers match your current filters. Try adjusting your search or register a new customer.</span>
                            </div>
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
      <footer className={`border-t border-slate-200 bg-white py-6 transition-all duration-300 ${sidebarExpanded ? 'pl-64' : 'pl-0'}`}>
        <div className="w-full text-center text-xs text-slate-500 space-y-1">
          <p>&copy; {new Date().getFullYear()} Infazys Finacle Systems. Universal Banking Solution.</p>
        </div>
      </footer>

    </div>
  );
}
