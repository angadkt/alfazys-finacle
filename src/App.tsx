import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import CustomerViewPage from './pages/CustomerViewPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import FincorePage from './pages/FincorePage';
import { ToastProvider } from './contexts/ToastContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('infazys_token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
          <Route path="/customers/new" element={<Navigate to="/customers" replace />} />
          <Route path="/customers/view/:id" element={<ProtectedRoute><CustomerViewPage /></ProtectedRoute>} />
          <Route path="/fincore" element={<ProtectedRoute><FincorePage /></ProtectedRoute>} />
          
          {/* Legacy fallback redirects */}
          <Route path="/admin-panel" element={<Navigate to="/customers" replace />} />
          <Route path="/admin-panel/customer/:id" element={<Navigate to="/customers" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
