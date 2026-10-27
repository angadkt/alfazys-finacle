import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, FolderOpen, X } from 'lucide-react';
import Header from '../components/Header';
import FinacleErrorBoundary from '../components/FinacleErrorBoundary';
import FinacleScreenLoader from '../components/FinacleScreenLoader';
import { DEFAULT_STAFF_PERMISSIONS } from '../types/staff';
import type { FinacleScreen } from '../types/staff';
import { dbService } from '../services/db';

const CreateRetailCifForm = lazy(() => import('../components/CreateRetailCifForm'));
const VerifyRetailCif = lazy(() => import('../components/VerifyRetailCif'));
const ViewRetailCif = lazy(() => import('../components/ViewRetailCif'));
const CreditEntryForm = lazy(() => import('../components/CreditEntryForm'));
const OrderEntryForm = lazy(() => import('../components/OrderEntryForm'));
const ReceivedAedScreen = lazy(() => import('../components/ReceivedAedScreen'));
const AedReportsScreen = lazy(() => import('../components/AedReportsScreen'));
const PendingAedReportScreen = lazy(() => import('../components/PendingAedReportScreen'));
const InrDispatchDeskScreen = lazy(() => import("../components/payouts/InrDispatchDeskScreen"));
const ServicerWalletsScreen = lazy(() => import("../components/payouts/ServicerWalletsScreen"));
const OpenAccountScreen = lazy(() => import("../components/OpenAccountScreen"));
const AddStaffForm = lazy(() => import('../components/AddStaffForm'));
const StaffManagement = lazy(() => import('../components/StaffManagement'));

export default function FincorePage() {
  const navigate = useNavigate();

  // Initialize activeScreen from sessionStorage to persist across page reloads (0-glitch)
  const [activeScreen, setActiveScreen] = useState<string>(() => {
    return sessionStorage.getItem('fincore_active_screen') || 'DASHBOARD';
  });

  const isAedScreen = (screen: string) => 
    screen === 'ORDER ENTRY' || 
    screen === 'RECEIVED AED' || 
    screen === 'AED SUMMARY & REPORTS' || 
    screen === 'AED REPORTS' || 
    screen === 'AED COLLECTON' ||
    screen === 'PENDING AED REPORT';

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isAedExpanded, setIsAedExpanded] = useState<boolean>(true);
  const [isPayoutExpanded, setIsPayoutExpanded] = useState<boolean>(true);

  const isPayoutScreen = (screen: string) =>
    screen === 'INR DISPATCH DESK' || 
    screen === 'SERVICER WALLETS' || 
    screen === 'INR PAYOUT';

  useEffect(() => {
    if (isPayoutScreen(activeScreen)) {
      setIsPayoutExpanded(true);
    }
  }, [activeScreen]);

  // Auto-expand AED folder in tree if active screen is within AED
  useEffect(() => {
    if (isAedScreen(activeScreen)) {
      setIsAedExpanded(true);
    }
  }, [activeScreen]);

  // Save activeScreen to sessionStorage on every screen switch
  useEffect(() => {
    sessionStorage.setItem('fincore_active_screen', activeScreen);
  }, [activeScreen]);

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

  // Has permission for AED section
  const hasAedAccess = userRole === 'super_admin' || permissions['AED COLLECTON'] || permissions['ORDER ENTRY'];

  // Base Menu items (excluding AED collection children which are rendered in the tree)
  const generalMenuItems = userRole === 'super_admin' ? [
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
    "OPEN ACCOUNT",
    "CREDIT ENTRY"
  ] : [
    ...(permissions['DASHBOARD'] ? ["DASHBOARD"] : []),
    ...(permissions['CREATE RETAIL CIF'] ? ["CREATE RETAIL CIF"] : []),
    ...(permissions['VIEW RETAIL CIF'] ? ["VIEW RETAIL CIF"] : []),
    ...(permissions['OPEN ACCOUNT'] ? ["OPEN ACCOUNT"] : []),
    ...(permissions['CREDIT ENTRY'] ? ["CREDIT ENTRY"] : []),
    ...(permissions['VERIFY RETAIL CIF CREATION'] ? ["VERIFY RETAIL CIF CREATION"] : []),
    ...(permissions['VERIFY RETAIL CIF MODIFICATION'] ? ["VERIFY RETAIL CIF MODIFICATION"] : [])
  ];

  const aedSubItems = [
    { name: "ORDER ENTRY", label: "ORDER ENTRY" },
    { name: "RECEIVED AED", label: "RECEIVED AED" },
    { name: "AED SUMMARY & REPORTS", label: "SUMMARY & REPORTS" },
    { name: "PENDING AED REPORT", label: "PENDING AED TO COLLECT" }
  ];

  const payoutSubItems = [
    { name: "INR DISPATCH DESK", label: "INR DISPATCH DESK" },
    { name: "SERVICER WALLETS", label: "SERVICER WALLETS" }
  ];

  const handleShortcutSelect = (screen: string) => {
    const upper = screen.toUpperCase().trim();
    if (upper.includes('ADD') && upper.includes('STAF')) {
      setActiveScreen('ADD STAFF');
    } else if (upper.includes('STAF') || upper === 'STFMGMT' || upper === 'STFM') {
      setActiveScreen('STAFF MANAGEMENT');
    } else if (upper.includes('RCV') || upper.includes('RECEIVED')) {
      setActiveScreen('RECEIVED AED');
    } else if (upper.includes('PEND') || upper === 'PAR' || upper === 'PAED') {
      setActiveScreen('PENDING AED REPORT');
    } else if (upper.includes('REPORT') || upper.includes('SUMMARY')) {
      setActiveScreen('AED SUMMARY & REPORTS');
    } else if (upper.includes('ORDER')) {
      setActiveScreen('ORDER ENTRY');
    } else if ((upper.includes('OPEN') && (upper.includes('ACC') || upper.includes('SERVICER'))) || upper === 'OAAC') {
      setActiveScreen('OPEN ACCOUNT');
    } else {
      setActiveScreen(screen);
    }
  };

  // Check if staff has permission to view current screen
  const isScreenAllowed = () => {
    if (userRole === 'super_admin') return true;
    if (activeScreen === 'ADD STAFF' || activeScreen === 'STAFF MANAGEMENT') return false;

    // AED collection children
    if (
      activeScreen === 'ORDER ENTRY' || 
      activeScreen === 'RECEIVED AED' || 
      activeScreen === 'AED SUMMARY & REPORTS' || 
      activeScreen === 'AED COLLECTON' || 
      activeScreen === 'AED REPORTS' ||
      activeScreen === 'PENDING AED REPORT' ||
      activeScreen === 'INR DISPATCH DESK' ||
      activeScreen === 'SERVICER WALLETS' ||
      activeScreen === 'INR PAYOUT'
    ) {
      return !!hasAedAccess;
    }

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
            <div className="bg-[#e4e4e4] flex items-center justify-between px-2.5 py-1 border-b border-[#a0a0a0] text-xs font-bold text-black">
              <span className="flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-[#104080]" /> Finacle Function Tree
              </span>
              <button 
                className="font-sans text-xs border border-gray-400 px-1 bg-[#d4d0c8] hover:bg-[#e4e4e4] leading-none h-4 flex items-center justify-center cursor-pointer"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="w-3 h-3 text-black stroke-[2.5]" />
              </button>
            </div>
            
            {/* Sidebar Tree List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-1.5 custom-scrollbar text-[14px]">
              {/* General Upper Menu Items */}
              {generalMenuItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-2.5 py-1.5 px-2 cursor-pointer hover:bg-[#316ac5] hover:text-white group tracking-wide text-[#000080] rounded-xs font-medium ${activeScreen === item ? 'bg-[#316ac5] text-white font-semibold' : ''}`}
                  onClick={() => {
                    setActiveScreen(item);
                  }}
                >
                  {/* Finacle Leaf Icon */}
                  <div className={`w-[15px] h-[16px] relative flex-shrink-0 bg-white border-2 border-[#3b73b9] flex items-start justify-end p-[1px] ${activeScreen === item ? 'border-white' : 'group-hover:border-white'}`}>
                    <div className={`w-[5px] h-[5px] ${activeScreen === item ? 'bg-white' : 'bg-[#3b73b9] group-hover:bg-white'}`} />
                  </div>
                  <span className="truncate">{item}</span>
                </div>
              ))}

              {/* INR PAYOUT & SERVICER Tree Group */}
              {hasAedAccess && (
                <div className="mt-1 pt-1 border-t border-gray-200">
                  <div 
                    className="flex items-center justify-between py-1 px-2 cursor-pointer hover:bg-[#e6edf8] text-[#104080] font-bold select-none group rounded-xs"
                    onClick={() => setIsPayoutExpanded(!isPayoutExpanded)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border border-[#8090a8] bg-white flex items-center justify-center text-[11px] leading-none font-mono text-[#104080] font-bold">
                        {isPayoutExpanded ? "−" : "+"}
                      </span>
                      <span className="text-[#104080] font-bold text-[14px] tracking-wide flex items-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5 text-[#104080]" /> INR PAYOUT
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      ({payoutSubItems.length})
                    </span>
                  </div>

                  {isPayoutExpanded && (
                    <div className="ml-3 pl-2.5 border-l-2 border-dotted border-[#9eb3cd] space-y-0.5 mt-0.5">
                      {payoutSubItems.map((sub, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 py-1.5 px-2 cursor-pointer hover:bg-[#316ac5] hover:text-white group text-[14px] font-medium text-[#000080] rounded-xs ${
                            activeScreen === sub.name ? "bg-[#316ac5] text-white font-bold" : ""
                          }`}
                          onClick={() => {
                            setActiveScreen(sub.name);
                          }}
                        >
                          <div className={`w-[13px] h-[14px] relative flex-shrink-0 bg-white border border-[#3b73b9] flex items-start justify-end p-[1px] ${activeScreen === sub.name ? "border-white" : "group-hover:border-white"}`}>
                            <div className={`w-[4px] h-[4px] ${activeScreen === sub.name ? "bg-white" : "bg-[#3b73b9] group-hover:bg-white"}`} />
                          </div>
                          <span className="truncate">{sub.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* AED COLLECTION Tree Group */}
              {hasAedAccess && (
                <div className="mt-1 pt-1 border-t border-gray-200">
                  {/* Folder Header */}
                  <div 
                    className="flex items-center justify-between py-1 px-2 cursor-pointer hover:bg-[#e6edf8] text-[#104080] font-bold select-none group rounded-xs"
                    onClick={() => setIsAedExpanded(!isAedExpanded)}
                  >
                    <div className="flex items-center gap-2">
                      {/* Plus/Minus Box */}
                      <span className="w-3.5 h-3.5 border border-[#8090a8] bg-white flex items-center justify-center text-[11px] leading-none font-mono text-[#104080] font-bold">
                        {isAedExpanded ? '−' : '+'}
                      </span>
                      <span className="text-[#104080] font-bold text-[14px] tracking-wide flex items-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5 text-[#104080]" /> AED COLLECTION
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      ({aedSubItems.length})
                    </span>
                  </div>

                  {/* Children Branch */}
                  {isAedExpanded && (
                    <div className="ml-3 pl-2.5 border-l-2 border-dotted border-[#9eb3cd] space-y-0.5 mt-0.5">
                      {aedSubItems.map((sub, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 py-1.5 px-2 cursor-pointer hover:bg-[#316ac5] hover:text-white group text-[14px] font-medium text-[#000080] rounded-xs ${
                            activeScreen === sub.name ? 'bg-[#316ac5] text-white font-bold' : ''
                          }`}
                          onClick={() => {
                            setActiveScreen(sub.name);
                          }}
                        >
                          {/* Sub Item Bullet */}
                          <div className={`w-[13px] h-[14px] relative flex-shrink-0 bg-white border border-[#3b73b9] flex items-start justify-end p-[1px] ${activeScreen === sub.name ? 'border-white' : 'group-hover:border-white'}`}>
                            <div className={`w-[4px] h-[4px] ${activeScreen === sub.name ? 'bg-white' : 'bg-[#3b73b9] group-hover:bg-white'}`} />
                          </div>
                          <span className="truncate">{sub.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <FinacleErrorBoundary key={activeScreen}>
            <Suspense fallback={<FinacleScreenLoader message={`Loading ${activeScreen}...`} />}>
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
              ) : activeScreen === 'RECEIVED AED' || activeScreen === 'AED COLLECTON' ? (
                <ReceivedAedScreen />
              ) : activeScreen === 'AED SUMMARY & REPORTS' || activeScreen === 'AED REPORTS' ? (
                <AedReportsScreen />
              ) : activeScreen === 'PENDING AED REPORT' ? (
                <PendingAedReportScreen />
              ) : activeScreen === 'INR DISPATCH DESK' || activeScreen === 'INR PAYOUT' ? (
                <InrDispatchDeskScreen />
              ) : activeScreen === 'SERVICER WALLETS' ? (
                <ServicerWalletsScreen onNavigate={(screen) => setActiveScreen(screen)} />
              ) : activeScreen === 'OPEN ACCOUNT' || activeScreen === 'OPEN SERVICER ACCOUNT' ? (
                <OpenAccountScreen onNavigate={(screen) => setActiveScreen(screen)} />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <h1 className="text-[44px] font-bold text-black tracking-wide" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                    Welcome to Finacle Payment Solutions
                  </h1>
                </div>
              )}
            </Suspense>
          </FinacleErrorBoundary>
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
