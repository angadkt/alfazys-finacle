import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import AddCustomerPage from './pages/AddCustomerPage';
import AdminPanelPage from './pages/AdminPanelPage';
import AdminCustomerDetailPage from './pages/AdminCustomerDetailPage';
import CustomerViewPage from './pages/CustomerViewPage';
import { ToastProvider } from './contexts/ToastContext';

// Trigger HMR rebuild to register newly created AdminCustomerDetailPage and CustomerViewPage files.
export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/new" element={<AddCustomerPage />} />
          <Route path="/customers/view/:id" element={<CustomerViewPage />} />
          <Route path="/admin-panel" element={<AdminPanelPage />} />
          <Route path="/admin-panel/customer/:id" element={<AdminCustomerDetailPage />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
