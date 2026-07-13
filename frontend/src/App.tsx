import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import ProtectedRoute from './components/ProtectedRoute'

// Route-based code splitting
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ReportPage = lazy(() => import('./pages/citizen/ReportPage'))
const CompanionPage = lazy(() => import('./pages/citizen/CompanionPage'))
const CitizenDashboardPage = lazy(() => import('./pages/citizen/CitizenDashboard'))
const DashboardPage = lazy(() => import('./pages/authority/DashboardPage'))
const AdminPage = lazy(() => import('./pages/admin/AdminPage'))

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <div className="min-h-screen relative overflow-hidden" style={{background: '#f8fafc'}}>
            {/* Global Ambient Mesh 3D Layer */}
            <div className="ambient-bg">
              <div className="blob-orb blob-purple" />
              <div className="blob-orb blob-blue" />
              <div className="blob-orb blob-green" />
            </div>

            <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Citizen Routes (no login required) */}
                <Route path="/report" element={<ReportPage />} />
                <Route path="/companion" element={<CompanionPage />} />

                {/* Citizen Dashboard (requires login) */}
                <Route
                  path="/citizen-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['citizen']}>
                      <CitizenDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Authority Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['authority', 'admin']}>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Panel */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App
