import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminLayout from './components/layout/AdminLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import ApplicationsPage from './pages/ApplicationsPage'
import AppVersionsPage from './pages/AppVersionsPage'
import MembershipsPage from './pages/MembershipsPage'
import PaymentsPage from './pages/PaymentsPage'
import PaymentConfigsPage from './pages/PaymentConfigsPage'
import MembershipPlansPage from './pages/MembershipPlansPage'
import RedemptionCodesPage from './pages/RedemptionCodesPage'
import AppConfigsPage from './pages/AppConfigsPage'

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="applications" element={<ApplicationsPage />} />
              <Route path="app-versions" element={<AppVersionsPage />} />
              <Route path="app-configs" element={<AppConfigsPage />} />
              <Route path="memberships" element={<MembershipsPage />} />
              <Route path="membership-plans" element={<MembershipPlansPage />} />
              <Route path="redemption-codes" element={<RedemptionCodesPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="payment-configs" element={<PaymentConfigsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
