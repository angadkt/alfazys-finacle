import { useState, useEffect, lazy, Suspense } from 'react';
import { 
  Building2, 
  Bed, 
  Utensils, 
  Users, 
  Receipt, 
  FileText, 
  Mail, 
  LayoutDashboard, 
  Folder, 
  X,
  CreditCard
} from 'lucide-react';
import Header from '../components/Header';
import FinacleErrorBoundary from '../components/FinacleErrorBoundary';
import FinacleScreenLoader from '../components/FinacleScreenLoader';

const FlatMaintenanceScreen = lazy(() => import('../components/flt/FlatMaintenanceScreen'));
const RoomInventoryScreen = lazy(() => import('../components/flt/RoomInventoryScreen'));
const MessPlanScreen = lazy(() => import('../components/flt/MessPlanScreen'));
const KitchenRosterScreen = lazy(() => import('../components/flt/KitchenRosterScreen'));
const MemberManagementScreen = lazy(() => import('../components/flt/MemberManagementScreen'));
const RentDueScreen = lazy(() => import('../components/flt/RentDueScreen'));
const RentCollectionScreen = lazy(() => import('../components/flt/RentCollectionScreen'));
const TenantStatementScreen = lazy(() => import('../components/flt/TenantStatementScreen'));
const EmailNoticeDispatchScreen = lazy(() => import('../components/flt/EmailNoticeDispatchScreen'));
const FltDashboard = lazy(() => import('../components/flt/FltDashboard'));

export default function FltPage() {
  const [activeScreen, setActiveScreen] = useState<string>(() => {
    return sessionStorage.getItem('flt_active_screen') || 'FLT DASHBOARD';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('flt_sidebar_open');
    return saved !== null ? saved === 'true' : false;
  });

  // Sync sidebar open state with localStorage to persist across refreshes
  useEffect(() => {
    localStorage.setItem('flt_sidebar_open', String(isSidebarOpen));
  }, [isSidebarOpen]);

  // Sync activeScreen with sessionStorage
  useEffect(() => {
    sessionStorage.setItem('flt_active_screen', activeScreen);
  }, [activeScreen]);

  const fltMenuItems = [
    { code: 'FDASH', label: 'FLT DASHBOARD', icon: LayoutDashboard, category: 'Analytics' },
    { code: 'FLTM', label: 'FLAT MAINTENANCE', icon: Building2, category: 'Inventory' },
    { code: 'ROOM', label: 'ROOM & BEDSPACE', icon: Bed, category: 'Inventory' },
    { code: 'MESS', label: 'MESS & FOOD PLANS', icon: Utensils, category: 'Mess Management' },
    { code: 'MBRM', label: 'MEMBER MANAGEMENT', icon: Users, category: 'Tenants' },
    { code: 'RENTD', label: 'RENT DUE & INVOICING', icon: FileText, category: 'Billing' },
    { code: 'RCPT', label: 'RENT COLLECTION', icon: Receipt, category: 'Billing' },
    { code: 'TLEDG', label: 'TENANT STATEMENT', icon: CreditCard, category: 'Audit' },
    { code: 'MROST', label: 'KITCHEN ROSTER', icon: Utensils, category: 'Mess Operations' },
    { code: 'MAIL', label: 'EMAIL NOTICE DISPATCH', icon: Mail, category: 'Communications' }
  ];

  const navigateToScreen = (screen: string) => {
    setActiveScreen(screen);
    setIsSidebarOpen(false);
  };

  const handleShortcutSelect = (screen: string) => {
    const upper = screen.toUpperCase().trim();
    if (upper.includes('FDASH') || upper === 'DASH' || upper.includes('FLT DASH')) {
      navigateToScreen('FLT DASHBOARD');
    } else if (upper.includes('FLTM') || upper.includes('FLAT')) {
      navigateToScreen('FLAT MAINTENANCE');
    } else if (upper.includes('ROOM') || upper.includes('BED')) {
      navigateToScreen('ROOM & BEDSPACE');
    } else if (upper.includes('MESS') || upper.includes('FOOD')) {
      navigateToScreen('MESS & FOOD PLANS');
    } else if (upper.includes('MBRM') || upper.includes('MEMBER') || upper.includes('TENANT')) {
      navigateToScreen('MEMBER MANAGEMENT');
    } else if (upper.includes('RENTD') || upper.includes('DUE') || upper.includes('INVOICE')) {
      navigateToScreen('RENT DUE & INVOICING');
    } else if (upper.includes('RCPT') || upper.includes('COLLECT') || upper.includes('RECEIPT')) {
      navigateToScreen('RENT COLLECTION');
    } else if (upper.includes('TLEDG') || upper.includes('STATEMENT')) {
      navigateToScreen('TENANT STATEMENT');
    } else if (upper.includes('MROST') || upper.includes('KITCHEN') || upper.includes('ROSTER')) {
      navigateToScreen('KITCHEN ROSTER');
    } else if (upper.includes('MAIL') || upper.includes('EMAIL') || upper.includes('NOTICE')) {
      navigateToScreen('EMAIL NOTICE DISPATCH');
    } else {
      navigateToScreen(screen);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#d4d0c8] flex flex-col font-sans select-none overflow-hidden" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <Header 
        onMenuClick={() => setIsSidebarOpen(true)} 
        onShortcutSelect={handleShortcutSelect}
      />

      {/* Main Body: Sidebar + Screen Canvas */}
      <div className="flex flex-1 overflow-hidden bg-white">
        
        {/* Function Tree Sidebar */}
        {isSidebarOpen && (
          <div className="w-[300px] flex flex-col border-r border-[#a0a0a0] bg-white flex-shrink-0 animate-in slide-in-from-left-4 duration-150">
            {/* Sidebar Header */}
            <div className="bg-[#00A2E8] text-white flex items-center justify-between px-2.5 py-1.5 border-b border-[#0089c7] text-xs font-bold shadow-2xs">
              <span className="flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-[#FFB800]" /> FLT Function Tree
              </span>
              <button 
                className="font-sans text-xs px-1.5 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded-xs leading-none flex items-center justify-center cursor-pointer transition-colors"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>

            {/* Menu List */}
            <div className="flex-1 overflow-y-auto p-1.5 text-xs bg-white divide-y divide-slate-100">
              {fltMenuItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = activeScreen === item.label || activeScreen === item.code;

                return (
                  <div 
                    key={idx} 
                    onClick={() => navigateToScreen(item.label)}
                    className={`flex items-center justify-between py-2 px-2.5 cursor-pointer rounded-xs transition-colors group ${
                      isActive 
                        ? 'bg-[#00A2E8] text-white font-bold shadow-2xs' 
                        : 'text-slate-700 hover:bg-[#EBF6FC] hover:text-[#005A9C]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#005A9C]'}`} />
                      <span>{item.label}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                      isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {item.code}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Sidebar Module Footer Info */}
            <div className="p-2 bg-[#f0ece1] border-t border-[#c0c0c0] text-[11px] text-slate-600">
              <div className="font-bold text-[#005A9C]">INFAZYS FLT v1.0</div>
              <div>Flat &amp; Mess Accommodation Core</div>
            </div>
          </div>
        )}

        {/* Right Active Screen Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#d4d0c8] overflow-hidden">
          
          {/* Active Tab Strip */}
          <div className="bg-[#d4d0c8] pt-1 px-2 border-b border-[#808080] flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="bg-white border-t-2 border-t-[#00A2E8] border-x border-[#808080] px-3 py-1 text-xs font-bold text-[#005A9C] flex items-center gap-2 shadow-2xs">
                <span>{activeScreen}</span>
                <span className="text-[10px] bg-blue-100 text-[#005A9C] px-1.5 rounded">ACTIVE</span>
              </div>
            </div>

            <div className="text-[11px] font-semibold text-slate-600 mr-2">
              Solution: <span className="text-[#005A9C] font-bold">FLT (Flat Management)</span>
            </div>
          </div>

          {/* Screen Content Render */}
          <div className="flex-1 bg-white overflow-hidden relative">
            <FinacleErrorBoundary>
              <Suspense fallback={<FinacleScreenLoader />}>
                {activeScreen === 'FLT DASHBOARD' || activeScreen === 'FDASH' ? (
                  <FltDashboard onNavigate={navigateToScreen} />
                ) : activeScreen === 'FLAT MAINTENANCE' || activeScreen === 'FLTM' ? (
                  <FlatMaintenanceScreen />
                ) : activeScreen === 'ROOM & BEDSPACE' || activeScreen === 'ROOM' ? (
                  <RoomInventoryScreen />
                ) : activeScreen === 'MESS & FOOD PLANS' || activeScreen === 'MESS' ? (
                  <MessPlanScreen />
                ) : activeScreen === 'MEMBER MANAGEMENT' || activeScreen === 'MBRM' ? (
                  <MemberManagementScreen />
                ) : activeScreen === 'RENT DUE & INVOICING' || activeScreen === 'RENTD' ? (
                  <RentDueScreen />
                ) : activeScreen === 'RENT COLLECTION' || activeScreen === 'RCPT' ? (
                  <RentCollectionScreen />
                ) : activeScreen === 'TENANT STATEMENT' || activeScreen === 'TLEDG' ? (
                  <TenantStatementScreen />
                ) : activeScreen === 'KITCHEN ROSTER' || activeScreen === 'MROST' ? (
                  <KitchenRosterScreen />
                ) : activeScreen === 'EMAIL NOTICE DISPATCH' || activeScreen === 'MAIL' ? (
                  <EmailNoticeDispatchScreen />
                ) : (
                  <FltDashboard onNavigate={navigateToScreen} />
                )}
              </Suspense>
            </FinacleErrorBoundary>
          </div>

        </div>

      </div>

    </div>
  );
}
