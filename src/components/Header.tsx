import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import finacleLogo from '../assets/finacle-logo.png';
import CostRateModal from './CostRateModal';
import FinacleSelect from './FinacleSelect';
import api from '../services/api';

interface ShortcutItem {
  code: string;
  name: string;
  screen: string;
  module: string;
  description: string;
  synonyms: string[];
  adminOnly?: boolean;
}

const SHORTCUT_REGISTRY: ShortcutItem[] = [
  {
    code: 'ACLI',
    name: 'Account Statement (ACLI)',
    screen: 'ACCOUNT STATEMENT (ACLI)',
    module: 'Accounts',
    description: 'Transaction audit & passbook ledger statement',
    synonyms: ['acli', 'statement', 'ledger', 'passbook', 'audit', 'statement audit', 'history']
  },
  {
    code: 'ACIQ',
    name: 'Account Enquiry (ACIQ)',
    screen: 'ACCOUNT ENQUIRY (ACIQ)',
    module: 'Accounts',
    description: 'Universal account master registry & balance search',
    synonyms: ['aciq', 'enquiry', 'inquiry', 'accounts', 'accts', 'search account', 'lookup']
  },
  {
    code: 'OAAC',
    name: 'Open Account',
    screen: 'OPEN ACCOUNT',
    module: 'Accounts',
    description: 'Open new customer or servicer account & link scheme',
    synonyms: ['oaac', 'open', 'open account', 'new account', 'create account', 'servicer']
  },
  {
    code: 'CE',
    name: 'Credit Entry',
    screen: 'CREDIT ENTRY',
    module: 'Operations',
    description: 'Post manual credits, float top-up & seed deposits',
    synonyms: ['ce', 'credit', 'credit entry', 'deposit', 'add funds', 'seed deposit', 'topup']
  },
  {
    code: 'OE',
    name: 'Order Entry',
    screen: 'ORDER ENTRY',
    module: 'AED Desk',
    description: 'Book new customer remittance & collection orders',
    synonyms: ['oe', 'order', 'order entry', 'booking', 'remittance', 'remit']
  },
  {
    code: 'CRCIF',
    name: 'Create Retail CIF',
    screen: 'CREATE RETAIL CIF',
    module: 'CIF Ops',
    description: 'Create customer master profile & KYC identity',
    synonyms: ['crcif', 'create cif', 'new cif', 'add customer', 'cif', 'customer info']
  },
  {
    code: 'VCIF',
    name: 'View Retail CIF',
    screen: 'VIEW RETAIL CIF',
    module: 'CIF Ops',
    description: 'Master retail customer lookup, details & documents',
    synonyms: ['vcif', 'view cif', 'search cif', 'customer view', 'lookup cif']
  },
  {
    code: 'VRCIF',
    name: 'Verify Retail CIF Creation',
    screen: 'VERIFY RETAIL CIF CREATION',
    module: 'CIF Ops',
    description: 'Maker-checker approval of retail CIF creation',
    synonyms: ['vrcif', 'verify cif', 'checker', 'approve cif', 'verify creation']
  },
  {
    code: 'VRMCIF',
    name: 'Verify Retail CIF Modification',
    screen: 'VERIFY RETAIL CIF MODIFICATION',
    module: 'CIF Ops',
    description: 'Verify retail CIF profile amendments & updates',
    synonyms: ['vrmcif', 'modify cif', 'verify modification', 'cif amendment']
  },
  {
    code: 'RCV',
    name: 'Received AED',
    screen: 'RECEIVED AED',
    module: 'AED Desk',
    description: 'AED cash clearing & agent collections desk',
    synonyms: ['rcv', 'aed', 'received aed', 'aed collection', 'cash collected', 'agent cash']
  },
  {
    code: 'PAR',
    name: 'Pending AED Report',
    screen: 'PENDING AED REPORT',
    module: 'AED Desk',
    description: 'Pending AED cash collections report by agent',
    synonyms: ['par', 'paed', 'pending', 'pending aed', 'pending report', 'outstanding aed']
  },
  {
    code: 'REP',
    name: 'AED Summary & Reports',
    screen: 'AED SUMMARY & REPORTS',
    module: 'AED Desk',
    description: 'Comprehensive AED operations, audit logs & summaries',
    synonyms: ['rep', 'summary', 'reports', 'aed reports', 'aed summary', 'daily summary']
  },
  {
    code: 'INR',
    name: 'INR Dispatch Desk',
    screen: 'INR DISPATCH DESK',
    module: 'Payouts',
    description: 'India payout queue & automated bank settlement',
    synonyms: ['inr', 'dispatch', 'payout', 'inr dispatch', 'clearing queue', 'neft', 'rtgs']
  },
  {
    code: 'SRVW',
    name: 'Servicer Wallets',
    screen: 'SERVICER WALLETS',
    module: 'Payouts',
    description: 'Servicer float balances, credit lines & bank wallets',
    synonyms: ['srvw', 'wallets', 'servicer wallets', 'float balance', 'credits', 'wallet balances']
  },
  {
    code: 'CR',
    name: 'Cost Rate & FX Calculator',
    screen: 'COST_RATE_MODAL',
    module: 'Tools',
    description: 'Live currency cost rate & interbank forex margins',
    synonyms: ['cr', 'cost', 'cost rate', 'fx', 'forex', 'calculator', 'currency converter', 'margin']
  },
  {
    code: 'DASH',
    name: 'Core Dashboard',
    screen: 'DASHBOARD',
    module: 'General',
    description: 'Executive banking dashboard overview',
    synonyms: ['dash', 'dashboard', 'home', 'overview', 'main']
  },
  {
    code: 'STFM',
    name: 'Staff Management',
    screen: 'STAFF MANAGEMENT',
    module: 'Admin',
    description: 'User profiles, roles & screen-level permissions',
    synonyms: ['stfm', 'staff', 'users', 'staff management', 'roles', 'employees'],
    adminOnly: true
  },
  {
    code: 'ASTF',
    name: 'Add Staff',
    screen: 'ADD STAFF',
    module: 'Admin',
    description: 'Provision new staff credentials & permissions',
    synonyms: ['astf', 'add staff', 'new staff', 'create user', 'provision'],
    adminOnly: true
  },
  {
    code: 'FDASH',
    name: 'FLT Dashboard',
    screen: 'FLT DASHBOARD',
    module: 'FLT Core',
    description: 'Flat management occupancy & revenue overview',
    synonyms: ['fdash', 'flt', 'flat dashboard', 'occupancy']
  },
  {
    code: 'FLTM',
    name: 'Flat Maintenance (FLTM)',
    screen: 'FLAT MAINTENANCE',
    module: 'FLT Flats',
    description: 'Property, building & flat master registry',
    synonyms: ['fltm', 'flat', 'flats', 'add flat', 'new flat', 'apartment']
  },
  {
    code: 'ROOM',
    name: 'Room & Bedspace Inventory',
    screen: 'ROOM & BEDSPACE',
    module: 'FLT Rooms',
    description: 'Rooms, partition beds & monthly rates',
    synonyms: ['room', 'rooms', 'bed', 'bedspace', 'beds']
  },
  {
    code: 'MESS',
    name: 'Mess & Food Plans',
    screen: 'MESS & FOOD PLANS',
    module: 'FLT Mess',
    description: 'Meal subscriptions, 3x daily & 2x daily packages',
    synonyms: ['mess', 'food', 'meal', 'meals', 'catering']
  },
  {
    code: 'MBRM',
    name: 'Member Management (MBRM)',
    screen: 'MEMBER MANAGEMENT',
    module: 'FLT Tenants',
    description: 'Tenant directory, room assignment & rent package',
    synonyms: ['mbrm', 'member', 'members', 'tenant', 'tenants', 'add member']
  },
  {
    code: 'RENTD',
    name: 'Rent Due & Invoicing (RENTD)',
    screen: 'RENT DUE & INVOICING',
    module: 'FLT Billing',
    description: 'Monthly rent dues, pending balances & demand notices',
    synonyms: ['rentd', 'rent', 'due', 'rent due', 'pending', 'invoice']
  },
  {
    code: 'RCPT',
    name: 'Rent Collection (RCPT)',
    screen: 'RENT COLLECTION',
    module: 'FLT Cash Desk',
    description: 'Collect room rent & mess fee, print voucher',
    synonyms: ['rcpt', 'receipt', 'collect', 'collect rent', 'payment']
  },
  {
    code: 'TLEDG',
    name: 'Tenant Statement & Ledger',
    screen: 'TENANT STATEMENT',
    module: 'FLT Audit',
    description: 'Tenant payment history and balance ledger',
    synonyms: ['tledg', 'statement', 'tenant ledger', 'tenant statement']
  },
  {
    code: 'MROST',
    name: 'Kitchen Mess Roster',
    screen: 'KITCHEN ROSTER',
    module: 'FLT Mess',
    description: 'Daily breakfast, lunch & dinner meal headcounts',
    synonyms: ['mrost', 'kitchen', 'roster', 'meal count', 'attendance']
  },
  {
    code: 'MAIL',
    name: 'Email Notice Dispatch',
    screen: 'EMAIL NOTICE DISPATCH',
    module: 'FLT Communications',
    description: 'Automated rent due alerts & reminder dispatch log',
    synonyms: ['mail', 'email', 'notices', 'alerts', 'due email']
  }
];

export default function Header({ 
  hideLogo = false, 
  onMenuClick,
  onShortcutSelect
}: { 
  hideLogo?: boolean; 
  onMenuClick?: () => void;
  onShortcutSelect?: (screen: string) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isFincoreActive = location.pathname.includes('/fincore');
  const isFltActive = location.pathname.includes('/flt');
  const [shortcutText, setShortcutText] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCostRateModalOpen, setIsCostRateModalOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeRole = localStorage.getItem('infazys_finacle_active_role');
  const isSuperAdmin = activeRole === 'super_admin' || activeRole === 'admin';
  const userName = localStorage.getItem('infazys_user_name') || (isSuperAdmin ? 'Super Admin' : 'STAFF');
  const staffCode = localStorage.getItem('infazys_staff_code') || (isSuperAdmin ? 'ADM001' : 'F2345');

  const now = new Date();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formattedHeaderDate = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('infazys_token');
    localStorage.removeItem('infazys_finacle_active_role');
    navigate('/');
  };

  // Filter and score shortcuts based on input query
  const filteredShortcuts = useMemo(() => {
    const list = SHORTCUT_REGISTRY.filter((item) => {
      if (item.adminOnly && !isSuperAdmin) return false;
      return true;
    });

    const query = shortcutText.trim().toLowerCase();
    if (!query) return list;

    return list
      .map((item) => {
        let score = 0;
        const codeLower = item.code.toLowerCase();
        const nameLower = item.name.toLowerCase();
        const descLower = item.description.toLowerCase();
        const moduleLower = item.module.toLowerCase();

        if (codeLower === query) score = 100;
        else if (codeLower.startsWith(query)) score = 80;
        else if (item.synonyms.some((s) => s.toLowerCase() === query)) score = 75;
        else if (nameLower.startsWith(query)) score = 70;
        else if (item.synonyms.some((s) => s.toLowerCase().startsWith(query))) score = 65;
        else if (codeLower.includes(query)) score = 50;
        else if (nameLower.includes(query)) score = 40;
        else if (item.synonyms.some((s) => s.toLowerCase().includes(query))) score = 30;
        else if (descLower.includes(query) || moduleLower.includes(query)) score = 20;

        return { item, score };
      })
      .filter((res) => res.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((res) => res.item);
  }, [shortcutText, isSuperAdmin]);

  const executeShortcut = (item: ShortcutItem) => {
    setIsDropdownOpen(false);
    setShortcutText('');
    setErrorMessage(null);

    if (item.screen === 'COST_RATE_MODAL') {
      setIsCostRateModalOpen(true);
      return;
    }

    if (onShortcutSelect) {
      onShortcutSelect(item.screen);
    } else {
      const isFltScreen = item.module.startsWith('FLT') || item.screen.startsWith('FLT') || [
        'FLAT MAINTENANCE', 
        'ROOM & BEDSPACE', 
        'MESS & FOOD PLANS', 
        'MEMBER MANAGEMENT', 
        'RENT DUE & INVOICING', 
        'RENT COLLECTION', 
        'TENANT STATEMENT', 
        'KITCHEN ROSTER', 
        'EMAIL NOTICE DISPATCH'
      ].includes(item.screen);

      if (isFltScreen) {
        sessionStorage.setItem('flt_active_screen', item.screen);
        navigate('/flt');
      } else {
        sessionStorage.setItem('fincore_active_screen', item.screen);
        navigate('/fincore');
      }
    }
  };

  const handleShortcutGo = () => {
    const query = shortcutText.trim();
    if (!query) {
      setIsDropdownOpen(true);
      return;
    }

    // Try finding exact code or top match
    if (filteredShortcuts.length > 0) {
      const target = filteredShortcuts[selectedIndex] || filteredShortcuts[0];
      executeShortcut(target);
    } else {
      setErrorMessage(`Unknown shortcut "${query}". Press ↓ or click to browse menu.`);
      setIsDropdownOpen(true);
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsDropdownOpen(true);
      setSelectedIndex((prev) => (filteredShortcuts.length ? (prev + 1) % filteredShortcuts.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsDropdownOpen(true);
      setSelectedIndex((prev) => (filteredShortcuts.length ? (prev - 1 + filteredShortcuts.length) % filteredShortcuts.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleShortcutGo();
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      inputRef.current?.blur();
    }
  };

  // Global hotkey: Alt+M or Ctrl+K to quick-focus Menu Shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && (e.key === 'm' || e.key === 'M')) || ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K'))) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsDropdownOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <div className="w-full flex flex-col font-sans antialiased shrink-0">
      {/* Top Utility Navbar - Canara Bank Sky Blue */}
      <div className="w-full bg-[#00A2E8] text-white flex items-center justify-between px-8 py-1.5 border-b border-[#0089c7] text-xs shadow-sm z-10">
        
        {/* Left Side Navigation Info */}
        <div className="flex items-center h-full">
          <div className="text-white font-semibold flex items-center gap-1.5">
            <span>User: {userName}</span>
            <span className="text-[11px] bg-[#FFB800] text-black px-2 py-0.5 rounded uppercase font-bold tracking-wide shadow-2xs">
              {isSuperAdmin ? 'ADMIN' : 'STAFF'}
            </span>
          </div>
          <div className="w-[1px] h-4 bg-white/30 mx-5"></div>
          <div className="flex items-center gap-2 text-white font-semibold">
            Time Zone: GMT
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
              <circle cx="15" cy="15" r="3"></circle>
              <line x1="9" y1="9" x2="15" y2="15"></line>
              <line x1="14" y1="8" x2="16" y2="10"></line>
            </svg>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-xs">Solution:</span>
            <div className="w-[170px]">
              <FinacleSelect
                value={isFincoreActive ? 'FINCORE' : (isFltActive ? 'FLT' : 'Select')}
                onChange={(e) => {
                  if (e.target.value === 'FINCORE') {
                    navigate('/fincore');
                  } else if (e.target.value === 'FLT') {
                    navigate('/flt');
                  }
                }}
                className="w-full"
                triggerClassName="py-1 px-2 text-xs font-semibold bg-white/95 text-[#0E498C] border-white"
                options={[
                  { value: "Select", label: "---Select---" },
                  { value: "FINCORE", label: "FINCORE" },
                  { value: "FLT", label: "FLT" }
                ]}
              />
            </div>
          </div>
          <div className="w-[1px] h-5 bg-white/30 mx-5"></div>
          
          {/* Logout/Exit Icon */}
          <button 
            className="flex items-center justify-center cursor-pointer bg-white/15 hover:bg-white/30 p-1 rounded-lg transition-colors border border-white/40 shadow-sm ml-1"
            onClick={handleLogout}
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Header Area (Logo & Branding) */}
      {!hideLogo && (
        <div className="bg-white w-full px-8 py-1 border-b border-gray-200 flex justify-between items-center relative overflow-hidden">
          <div className="flex items-center gap-[2px] shrink-0 z-10 bg-white pr-4">
            <img src={finacleLogo} alt="Finacle Logo" className="w-12 h-12 object-contain" />
            <div className="text-3xl tracking-tight text-[#111827] font-bold" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
              Infazys Finacle<sup className="text-sm font-medium">®</sup>
            </div>
          </div>
          
          {/* Scrolling Marquee Notice in Empty Space */}
          <div 
            className="min-w-0 flex-1 mx-6 mr-[440px] overflow-hidden relative flex items-center h-10 select-none cursor-pointer"
            title="Hover to pause scrolling"
          >
            <div className="animate-header-marquee flex items-center">
              <div className="flex items-center shrink-0 pr-16 text-[14px] font-semibold text-[#8b1818] tracking-wide">
                <span className="bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5] text-[11px] font-bold px-2 py-0.5 mr-2 uppercase tracking-wide rounded-xs">
                  Notice
                </span>
                <span>
                  Bulk NEFT/RTGS via Infazys Finacle is available only from 7.00 AM to 7.00 PM on working days. Approvals outside this window, or on weekends and bank holidays, will be processed on the next working day.
                </span>
              </div>
              <div className="flex items-center shrink-0 pr-16 text-[14px] font-semibold text-[#8b1818] tracking-wide">
                <span className="bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5] text-[11px] font-bold px-2 py-0.5 mr-2 uppercase tracking-wide rounded-xs">
                  Notice
                </span>
                <span>
                  Bulk NEFT/RTGS via Infazys Finacle is available only from 7.00 AM to 7.00 PM on working days. Approvals outside this window, or on weekends and bank holidays, will be processed on the next working day.
                </span>
              </div>
            </div>
          </div>

          {/* Top Right Toolbar */}
          <div className="absolute top-0 right-0 flex items-center text-xs font-bold text-[#0E498C] bg-[#f4f7f9] border border-[#a0a0a0] border-t-0 border-r-0 z-10">
            <button className="px-2 py-0.5 hover:bg-[#EBF6FC] flex items-center justify-center h-full">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10"/><path d="M17 7 7 17"/></svg>
            </button>
            <div className="w-[1px] h-3 border-l-[1.5px] border-dotted border-[#808080]"></div>
            <button className="px-2 py-0.5 hover:bg-[#EBF6FC] tracking-wide" onClick={onMenuClick}>Menu</button>
            <div className="w-[1px] h-3 border-l-[1.5px] border-dotted border-[#808080]"></div>
            <button className="px-2 py-0.5 hover:bg-[#EBF6FC] tracking-wide">CCY Converter</button>
            <div className="w-[1px] h-3 border-l-[1.5px] border-dotted border-[#808080]"></div>
            <button disabled className="px-2 py-0.5 tracking-wide text-gray-400 cursor-not-allowed" title="Profit Calculator (Disabled)">Profit Calculator</button>
            <div className="w-[1px] h-3 border-l-[1.5px] border-dotted border-[#808080]"></div>
            <button className="px-2 py-0.5 hover:bg-[#EBF6FC] tracking-wide" onClick={() => setIsCostRateModalOpen(true)}>Cost Rate</button>
          </div>
        </div>
      )}

      {/* Blue Banner - Canara Bank Sky Blue Canvas */}
      <div 
        className="w-full px-8 py-2 shadow-sm border-t border-[#0089c7] flex items-center justify-between"
        style={{
          background: 'linear-gradient(to bottom, #00A2E8 0%, #0093D6 50%, #0084C2 100%)'
        }}
      >
        <span className="text-white font-bold text-[14px] tracking-wide text-shadow-sm flex items-center gap-2">
          <span>Universal Payment Solution from Infazys</span>
        </span>
        
        <div className="flex items-center text-white text-[12px] h-[22px] font-normal" style={{ fontWeight: 400 }}>
          <span style={{ fontWeight: 400 }} className="hidden sm:inline text-white/95">
            {isSuperAdmin 
              ? `Super Admin | 25/02/2014 | Menu Shortcut:` 
              : `${formattedHeaderDate} | User ${userName} | ${staffCode} | Menu Shortcut:`}
          </span>
          <span style={{ fontWeight: 400 }} className="sm:hidden text-white/95">
            Menu Shortcut:
          </span>

          <div ref={dropdownRef} className="relative inline-flex items-center ml-1">
            <div className="relative flex items-center">
              <input 
                ref={inputRef}
                type="text" 
                value={shortcutText}
                onFocus={() => {
                  setIsDropdownOpen(true);
                  setSelectedIndex(0);
                }}
                onChange={(e) => {
                  setShortcutText(e.target.value);
                  setIsDropdownOpen(true);
                  setSelectedIndex(0);
                  setErrorMessage(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="E.G. ACLI, CREDIT, OE..."
                className="w-[200px] sm:w-[240px] h-[22px] border border-white/80 bg-white px-2 pr-6 outline-none text-xs uppercase font-mono font-bold text-[#0E498C] placeholder:font-sans placeholder:font-normal placeholder:text-gray-400 placeholder:normal-case shadow-inner focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800]" 
              />
              {shortcutText ? (
                <button
                  type="button"
                  onClick={() => {
                    setShortcutText('');
                    setSelectedIndex(0);
                    inputRef.current?.focus();
                  }}
                  className="absolute right-1 text-gray-400 hover:text-gray-700 cursor-pointer text-xs font-bold px-1"
                  title="Clear"
                >
                  ×
                </button>
              ) : (
                <span className="absolute right-1.5 text-[9px] font-mono text-gray-400 select-none pointer-events-none hidden sm:inline">
                  Alt+M
                </span>
              )}
            </div>

            <button 
              onClick={handleShortcutGo}
              title="Execute Menu Shortcut (Enter)"
              className="ml-1 h-[22px] bg-[#0E498C] hover:bg-[#002D62] text-white border-2 border-[#00B5E2] px-3 flex items-center justify-center text-xs font-bold cursor-pointer transition-all shadow-md active:scale-95"
            >
              Go
            </button>

            {/* Error Tooltip */}
            {errorMessage && (
              <div className="absolute right-0 top-full mt-1 w-[320px] bg-red-50 border border-red-300 text-red-800 text-[11px] p-2 rounded shadow-md z-[210] flex items-center gap-1.5">
                <span className="font-bold">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Floating Fastpath Autocomplete Dropdown */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-[380px] sm:w-[440px] bg-white border-2 border-[#0E498C] shadow-2xl z-[200] rounded-xs select-none overflow-hidden animate-in fade-in zoom-in-95 duration-75">
                {/* Header */}
                <div className="bg-[#0E498C] text-white px-2.5 py-1 text-[11px] font-bold flex items-center justify-between tracking-wide">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#FFB800]">⚡</span>
                    <span className="text-white">FINACLE FASTPATH MENU SHORTCUTS</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/80">
                    [↑↓] Move • [↵] Go
                  </span>
                </div>

                {/* List Items */}
                <div className="max-h-[290px] overflow-y-auto custom-scrollbar divide-y divide-gray-100 bg-white">
                  {filteredShortcuts.length > 0 ? (
                    filteredShortcuts.map((item, idx) => {
                      const isSelected = idx === selectedIndex;
                      return (
                        <div
                          key={item.code}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          onClick={() => executeShortcut(item)}
                          className={`px-3 py-1.5 cursor-pointer flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-[#00A2E8] text-white'
                              : 'hover:bg-[#EBF6FC] text-gray-900'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                  isSelected
                                    ? 'bg-white/20 text-white border border-white/40'
                                    : 'bg-[#EBF6FC] text-[#0E498C] border border-[#bce2f8]'
                                }`}
                              >
                                {item.code}
                              </span>
                              <span className="font-bold text-xs truncate">
                                {item.name}
                              </span>
                            </div>
                            <span
                              className={`text-[10.5px] truncate mt-0.5 ${
                                isSelected ? 'text-white/90' : 'text-gray-500'
                              }`}
                            >
                              {item.description}
                            </span>
                          </div>

                          <span
                            className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                              isSelected
                                ? 'bg-[#FFB800] text-black font-extrabold'
                                : 'bg-[#f0f4f8] text-gray-600'
                            }`}
                          >
                            {item.module}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-xs">
                      <div className="font-semibold text-gray-700">No shortcut matches "{shortcutText}"</div>
                      <div className="text-[11px] text-gray-400 mt-1">
                        Try popular codes: <span className="font-mono font-bold text-[#0E498C]">ACLI</span>, <span className="font-mono font-bold text-[#0E498C]">ACIQ</span>, <span className="font-mono font-bold text-[#0E498C]">OAAC</span>, <span className="font-mono font-bold text-[#0E498C]">CREDIT</span>, <span className="font-mono font-bold text-[#0E498C]">CRCIF</span>, <span className="font-mono font-bold text-[#0E498C]">OE</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Ribbon */}
                <div className="bg-[#EBF6FC] border-t border-[#bce2f8] px-3 py-1 text-[10.5px] text-[#0E498C] flex items-center justify-between font-mono">
                  <span>
                    Press <kbd className="bg-white border border-gray-300 px-1 rounded shadow-2xs font-bold text-black">Alt+M</kbd> to quick-focus
                  </span>
                  <span className="font-bold">{filteredShortcuts.length} screens</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dedicated Cost Rate Modal */}
      <CostRateModal 
        isOpen={isCostRateModalOpen} 
        onClose={() => setIsCostRateModalOpen(false)} 
      />
    </div>
  );
}
