import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import { ToastProvider } from './contexts/ToastContext';
import FinacleErrorBoundary from './components/FinacleErrorBoundary';
import FinacleScreenLoader from './components/FinacleScreenLoader';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const CustomerViewPage = lazy(() => import('./pages/CustomerViewPage'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'));
const FincorePage = lazy(() => import('./pages/FincorePage'));
const FltPage = lazy(() => import('./pages/FltPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('infazys_token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <FinacleErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<FinacleScreenLoader />}>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
              <Route path="/customers/new" element={<Navigate to="/customers" replace />} />
              <Route path="/customers/view/:id" element={<ProtectedRoute><CustomerViewPage /></ProtectedRoute>} />
              <Route path="/fincore" element={<ProtectedRoute><FincorePage /></ProtectedRoute>} />
              <Route path="/flt" element={<ProtectedRoute><FltPage /></ProtectedRoute>} />
              
              {/* Legacy fallback redirects */}
              <Route path="/admin-panel" element={<Navigate to="/customers" replace />} />
              <Route path="/admin-panel/customer/:id" element={<Navigate to="/customers" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </FinacleErrorBoundary>
  );
}
