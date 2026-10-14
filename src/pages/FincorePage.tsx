import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CreateRetailCifForm from '../components/CreateRetailCifForm';
import VerifyRetailCif from '../components/VerifyRetailCif';
import ViewRetailCif from '../components/ViewRetailCif';
import CreditEntryForm from '../components/CreditEntryForm';
import OrderEntryForm from '../components/OrderEntryForm';
import AddStaffForm from '../components/AddStaffForm';
import StaffManagement from '../components/StaffManagement';
import { DEFAULT_STAFF_PERMISSIONS } from '../types/staff';
import type { FinacleScreen } from '../types/staff';

import { dbService } from '../services/db';

export default function FincorePage() {
  const navigate = useNavigate();
  const [activeScreen, setActiveScreen] = useState<string>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const userRole = dbService.getUserRole();

  // Enforce mandatory first-login password change
  useEffect(() => {
    const isMustChange = localStorage.getItem('infazys_must_change_password') === 'true';
    const currentUser = userRole === 'staff' ? dbService.getCurrentUserStaff() : null;
    if (isMustChange || (currentUser && currentUser.mustChangePassword)) {
      navigate('/change-password?mandatory=true');
    }
  }, [userRole, navigate]);

  const currentStaff = userRole === 'staff' ? dbService.getCurrentUserStaff() : null;
  const permissions = currentStaff ? currentStaff.permissions : DEFAULT_STAFF_PERMISSIONS;

  // Build dynamic menu items based on Role and Staff Permissions
  const menuItems = userRole === 'super_admin' ? [
    "DASHBOARD",
    "ADD STAFF",
    "STAFF MANAGEMENT",
    "USER PROFILE MAINTENANCE",
    "EMPLOYEE FILE MAINTENANCE",
    "ROLE PROFILE MAINTENANCE",
    "CREATE RETAIL CIF",
    "VERIFY RETAIL CIF CREATION",
    "VERIFY RETAIL CIF MODIFICATION",
    "VIEW RETAIL CIF",
    "ORDER ENTRY",
    "CREDIT ENTRY",
    "AED COLLECTON"
  ] : [
    ...(permissions['DASHBOARD'] ? ["DASHBOARD"] : []),
    ...(permissions['CREATE RETAIL CIF'] ? ["CREATE RETAIL CIF"] : []),
    ...(permissions['VIEW RETAIL CIF'] ? ["VIEW RETAIL CIF"] : []),
    ...(permissions['ORDER ENTRY'] ? ["ORDER ENTRY"] : []),
    ...(permissions['CREDIT ENTRY'] ? ["CREDIT ENTRY"] : []),
    ...(permissions['AED COLLECTON'] ? ["AED COLLECTON"] : []),
    ...(permissions['VERIFY RETAIL CIF CREATION'] ? ["VERIFY RETAIL CIF CREATION"] : []),
    ...(permissions['VERIFY RETAIL CIF MODIFICATION'] ? ["VERIFY RETAIL CIF MODIFICATION"] : [])
  ];

  const handleShortcutSelect = (screen: string) => {
    const upper = screen.toUpperCase().trim();
    if (upper.includes('ADD') && upper.includes('STAF')) {
      setActiveScreen('ADD STAFF');
    } else if (upper.includes('STAF') || upper === 'STFMGMT' || upper === 'STFM') {
      setActiveScreen('STAFF MANAGEMENT');
    } else {
      setActiveScreen(screen);
    }
  };

  // Check if staff has permission to view current screen
  const isScreenAllowed = () => {
    if (userRole === 'super_admin') return true;
    if (activeScreen === 'ADD STAFF' || activeScreen === 'STAFF MANAGEMENT') return false;
    const key = activeScreen as FinacleScreen;
    if (key in permissions) {
      return !!permissions[key];
    }
    return true;
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
          {!isScreenAllowed() ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#f4f7fb]">
              <div className="bg-[#e4e4e4] border-2 border-[#104080] p-4 max-w-md shadow-lg text-center">
                <div className="bg-[#104080] text-white py-1 px-2 text-[12px] font-bold mb-3 flex items-center justify-between">
                  <span>FINACLE CORE — ACCESS DENIED</span>
                  <span>SECURITY EXCEPTION</span>
                </div>
                <div className="text-[13px] font-bold text-red-600 mb-1">
                  Unauthorized Module Access
                </div>
                <p className="text-[12px] text-gray-700 mb-4">
                  Your staff account does not have permission to view <strong>{activeScreen}</strong>. Please request module authorization from the Administrator.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveScreen('DASHBOARD')}
                  className="bg-[#d4d0c8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] px-4 py-1 text-[12px] font-bold hover:bg-[#e4e4e4]"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : activeScreen === 'ADD STAFF' ? (
            <AddStaffForm onNavigateToManagement={() => setActiveScreen('STAFF MANAGEMENT')} />
          ) : activeScreen === 'STAFF MANAGEMENT' ? (
            <StaffManagement onNavigateToAddStaff={() => setActiveScreen('ADD STAFF')} />
          ) : activeScreen === 'CREATE RETAIL CIF' ? (
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
