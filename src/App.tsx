import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import CustomerViewPage from './pages/CustomerViewPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import FincorePage from './pages/FincorePage';
import { ToastProvider } from './contexts/ToastContext';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/new" element={<Navigate to="/customers" replace />} />
          <Route path="/customers/view/:id" element={<CustomerViewPage />} />
          <Route path="/fincore" element={<FincorePage />} />
          
          {/* Legacy fallback redirects */}
          <Route path="/admin-panel" element={<Navigate to="/customers" replace />} />
          <Route path="/admin-panel/customer/:id" element={<Navigate to="/customers" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
