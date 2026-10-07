import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import finacleLogo from '../assets/finacle-logo.png';

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
  const [shortcutText, setShortcutText] = useState('');

  const handleLogout = () => {
    navigate('/');
  };

  const handleShortcutGo = () => {
    const code = shortcutText.trim().toUpperCase();
    if (!code) return;

    if (code.includes('CRED') || code === 'CE') {
      if (onShortcutSelect) onShortcutSelect('CREDIT ENTRY');
    } else if (code.includes('ORD') || code === 'OE') {
      if (onShortcutSelect) onShortcutSelect('ORDER ENTRY');
    } else if (code.includes('CREATE') || code === 'CIF' || code === 'CRCIF') {
      if (onShortcutSelect) onShortcutSelect('CREATE RETAIL CIF');
    } else if (code.includes('VIEW') || code === 'VCIF') {
      if (onShortcutSelect) onShortcutSelect('VIEW RETAIL CIF');
    } else if (code.includes('VERIF') || code === 'VRCIF') {
      if (onShortcutSelect) onShortcutSelect('VERIFY RETAIL CIF CREATION');
    } else if (onShortcutSelect) {
      onShortcutSelect(code);
    }
    setShortcutText('');
  };

  return (
    <div className="w-full flex flex-col font-sans antialiased shrink-0">
      {/* Top Utility Navbar */}
      <div className="w-full bg-white flex items-center justify-between px-8 py-1 border-b border-gray-200 text-[11px] shadow-sm z-10">
        
        {/* Left Side Navigation Info */}
        <div className="flex items-center h-full">
          <div className="text-[#1e4676] font-semibold">User: UBSADMIN</div>
          <div className="w-[1px] h-4 bg-gray-300 mx-5"></div>
          <div className="flex items-center gap-2 text-[#1e4676] font-semibold">
            Time Zone: GMT
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
              <circle cx="15" cy="15" r="3"></circle>
              <line x1="9" y1="9" x2="15" y2="15"></line>
              <line x1="14" y1="8" x2="16" y2="10"></line>
            </svg>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center">
          <div className="flex items-center gap-3">
            <span className="text-[#1e4676] font-semibold">Solution:</span>
            <select 
              className="border border-gray-300 rounded-md bg-white text-gray-700 text-[11px] w-[180px] py-1 px-2 focus:outline-none focus:ring-1 focus:ring-[#1e4676] focus:border-[#1e4676] transition-colors" 
              defaultValue="Select"
              onChange={(e) => {
                if (e.target.value === 'FINCORE') {
                  navigate('/fincore');
                }
              }}
            >
              <option value="Select">---Select---</option>
              <option value="FINCORE">FINCORE</option>
            </select>
          </div>
          <div className="w-[1px] h-5 bg-gray-300 mx-5"></div>
          
          {/* Logout/Exit Icon */}
          <button 
            className="flex items-center justify-center cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition-colors border-2 border-[#e2e8f0] shadow-sm ml-1"
            onClick={handleLogout}
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Header Area (Logo & Branding) */}
      {!hideLogo && (
        <div className="bg-white w-full px-8 py-1 border-b border-gray-200 flex justify-between items-center relative">
          <div className="flex items-center gap-[2px]">
            <img src={finacleLogo} alt="Finacle Logo" className="w-12 h-12 object-contain" />
            <div className="text-3xl tracking-tight text-[#111827] font-bold" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
              Infasys Finacle<sup className="text-sm font-medium">®</sup>
            </div>
          </div>
          
          {/* Top Right Toolbar */}
          <div className="absolute top-0 right-0 flex items-center text-[11px] font-bold text-[#1e4676] bg-[#f4f7f9] border border-[#a0a0a0] border-t-0 border-r-0">
            <button className="px-2 py-0.5 hover:bg-[#e4e9f0] flex items-center justify-center h-full">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10"/><path d="M17 7 7 17"/></svg>
            </button>
            <div className="w-[1px] h-3 border-l-[1.5px] border-dotted border-[#808080]"></div>
            <button className="px-2 py-0.5 hover:bg-[#e4e9f0] tracking-wide" onClick={onMenuClick}>Menu</button>
            <div className="w-[1px] h-3 border-l-[1.5px] border-dotted border-[#808080]"></div>
            <button className="px-2 py-0.5 hover:bg-[#e4e9f0] tracking-wide">CCY Converter</button>
          </div>
        </div>
      )}

      {/* Blue Banner */}
      <div 
        className="w-full px-8 py-2 shadow-sm border-t border-[#8fa8c0] flex items-center justify-between"
        style={{
          background: 'linear-gradient(to bottom, #758eab 0%, #a6bcd0 25%, #aec3d6 50%, #9cb3c8 75%, #b1c6d8 85%, #88a1b9 95%, #5e7a94 100%)'
        }}
      >
        <span className="text-[#1e4676] font-bold text-[14px] tracking-wide text-shadow-sm">
          Universal Payment Solution from Infasys
        </span>
        
        <div className="flex items-center text-black text-[12px] h-[22px]">
          <span>UBSADMIN | 25/02/2014 | Menu Shortcut:</span>
          <input 
            type="text" 
            value={shortcutText}
            onChange={(e) => setShortcutText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleShortcutGo();
            }}
            placeholder="e.g. CREDIT"
            className="ml-1 w-[130px] h-[20px] border border-[#a0a0a0] bg-white px-1 outline-none text-[11px] uppercase" 
          />
          <button 
            onClick={handleShortcutGo}
            className="ml-1 h-[20px] bg-[#d4d0c8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] px-2 flex items-center justify-center hover:bg-[#e4e4e4] active:border-t-[#8f8f9d] active:border-l-[#8f8f9d] active:border-b-white active:border-r-white text-[11px] font-bold"
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
}
