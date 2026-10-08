import { useState } from 'react';
import Header from '../components/Header';
import CreateRetailCifForm from '../components/CreateRetailCifForm';
import VerifyRetailCif from '../components/VerifyRetailCif';
import ViewRetailCif from '../components/ViewRetailCif';
import CreditEntryForm from '../components/CreditEntryForm';
import OrderEntryForm from '../components/OrderEntryForm';

import { dbService } from '../services/db';

export default function FincorePage() {
  const [activeScreen, setActiveScreen] = useState<string>('CREDIT ENTRY');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const userRole = dbService.getUserRole();

  const menuItems = [
    "USER PROFILE MAINTENANCE",
    "EMPLOYEE FILE MAINTENANCE",
    "ROLE PROFILE MAINTENANCE",
    "CREATE RETAIL CIF",
    ...(userRole === 'super_admin' ? ["VERIFY RETAIL CIF CREATION"] : []),
    "MODIFY RETAIL CIF",
    ...(userRole === 'super_admin' ? ["VERIFY RETAIL CIF MODIFICATION"] : []),
    "VIEW RETAIL CIF",
    "ORDER ENTRY",
    "CREDIT ENTRY",
    "AED COLLECTON"
  ];

  const handleShortcutSelect = (screen: string) => {
    setActiveScreen(screen);
  };

  return (
    <div className="min-h-screen w-full bg-[#d4d0c8] flex flex-col font-sans select-none overflow-hidden" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <Header 
        onMenuClick={() => setIsSidebarOpen(true)} 
        onShortcutSelect={handleShortcutSelect}
      />

      {/* 4. Main Body: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden bg-white">
        
        {/* Sidebar */}
        {isSidebarOpen && (
          <div className="w-[320px] flex flex-col border-r border-[#a0a0a0] bg-[#f8f9fa] flex-shrink-0">
            {/* Sidebar Header */}
            <div className="bg-[#e4e4e4] flex items-center justify-between px-2 py-0.5 border-b border-[#a0a0a0] text-[11px] font-bold text-black">
              <span>Menu</span>
              <button 
                className="font-sans text-xs border border-gray-400 px-1 bg-[#d4d0c8] hover:bg-[#e4e4e4] leading-none h-4 flex items-center justify-center cursor-pointer"
                onClick={() => setIsSidebarOpen(false)}
              >
                x
              </button>
            </div>
            
            {/* Sidebar List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-1 custom-scrollbar">
              {menuItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-2.5 py-1.5 px-2 cursor-pointer hover:bg-[#316ac5] hover:text-white group text-[14px] tracking-wide text-[#000080] ${activeScreen === item ? 'bg-[#316ac5] text-white' : ''}`}
                  onClick={() => {
                    setActiveScreen(item);
                    setIsSidebarOpen(false);
                  }}
                >
                  {/* File Icon */}
                  <div className={`w-[16px] h-[18px] relative flex-shrink-0 bg-white border-2 border-[#3b73b9] flex items-start justify-end p-[1px] ${activeScreen === item ? 'border-white' : 'group-hover:border-white'}`}>
                    <div className={`w-[6px] h-[6px] ${activeScreen === item ? 'bg-white' : 'bg-[#3b73b9] group-hover:bg-white'}`} />
                  </div>
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {activeScreen === 'CREATE RETAIL CIF' ? (
            <CreateRetailCifForm />
          ) : activeScreen === 'VERIFY RETAIL CIF CREATION' ? (
            <VerifyRetailCif />
          ) : activeScreen === 'VIEW RETAIL CIF' ? (
            <ViewRetailCif />
          ) : activeScreen === 'CREDIT ENTRY' ? (
            <CreditEntryForm />
          ) : activeScreen === 'ORDER ENTRY' ? (
            <OrderEntryForm />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <h1 className="text-[44px] font-bold text-black tracking-wide" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                Welcome to Finacle Payment Solutions
              </h1>
            </div>
          )}
        </div>
      </div>

      {/* Global styles for retro scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 16px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #dfdfdf;
          border-left: 1px solid #e5e5e5;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #c0c0c0;
          border: 1px solid #fff;
          border-right-color: #808080;
          border-bottom-color: #808080;
        }
        .custom-scrollbar::-webkit-scrollbar-button {
          display: block;
          background-color: #d4d0c8;
          height: 16px;
          border: 1px solid #fff;
          border-right-color: #808080;
          border-bottom-color: #808080;
        }
      `}</style>

    </div>
  );
}
