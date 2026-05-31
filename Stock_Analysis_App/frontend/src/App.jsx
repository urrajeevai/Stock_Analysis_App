import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import TradesPage from './pages/TradesPage.jsx'
import NewTradePage from './pages/NewTradePage.jsx'
import TradeDetailPage from './pages/TradeDetailPage.jsx'
import AnalysisPage from './pages/AnalysisPage.jsx'
import NewAnalysisPage from './pages/NewAnalysisPage.jsx'
import AnalysisDetailPage from './pages/AnalysisDetailPage.jsx'
import PerformancePage from './pages/PerformancePage.jsx'
import AlertsPage from './pages/AlertsPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import StocksPage from './pages/StocksPage.jsx'
import RolesPage from './pages/RolesPage.jsx'
import MomentumPage from './pages/MomentumPage.jsx'
import RsiPage from './pages/RsiPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'TRADER', 'VIEWER']} />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/trades" element={<TradesPage />} />
              <Route path="/trades/new" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TRADER']}><NewTradePage /></ProtectedRoute>
              } />
              <Route path="/trades/:id" element={<TradeDetailPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/analysis/new" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TRADER']}><NewAnalysisPage /></ProtectedRoute>
              } />
              <Route path="/analysis/:id" element={<AnalysisDetailPage />} />
              <Route path="/performance" element={<PerformancePage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/stocks" element={<StocksPage />} />
              <Route path="/momentum" element={<MomentumPage />} />
              <Route path="/rsi" element={<RsiPage />} />
              <Route path="/roles" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TRADER', 'VIEWER']}><RolesPage /></ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['ADMIN']}><AdminPage /></ProtectedRoute>
              } />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
