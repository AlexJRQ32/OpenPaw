import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './features/auth/context/AuthContext'
import { LoadingProvider } from './shared/context/LoadingContext'
import { ToastProvider } from './shared/context/ToastContext'
import { GlobalLoader } from './shared/components/GlobalLoader/GlobalLoader'
import { ProtectedRoute } from './shared/components/ProtectedRoute/ProtectedRoute'
import { FUNCIONARIOS_ROLE_IDS, ROLE_IDS } from './constants'

const LandingPage = lazy(() => import(`./features/landing/pages/LandingPage`).then(m => ({ default: m.LandingPage })))
const LoginPage = lazy(() => import(`./features/auth/pages/LoginPage`).then(m => ({ default: m.LoginPage })))
const AuthMethodPage = lazy(() => import(`./features/auth/pages/AuthMethodPage`).then(m => ({ default: m.AuthMethodPage })))
const RegisterPage = lazy(() => import(`./features/auth/pages/RegisterPage`).then(m => ({ default: m.RegisterPage })))
const DashboardPage = lazy(() => import(`./features/dashboard/pages/DashboardPage`).then(m => ({ default: m.DashboardPage })))
const ProfilePage = lazy(() => import(`./features/profile/pages/ProfilePage`).then(m => ({ default: m.ProfilePage })))
const VeterinaryRegistrationPage = lazy(() => import(`./features/veterinary-registration/pages/VeterinaryRegistrationPage`).then(m => ({ default: m.VeterinaryRegistrationPage })))
const StoreRegistrationPage = lazy(() => import(`./features/store-registration/pages/StoreRegistrationPage`).then(m => ({ default: m.StoreRegistrationPage })))
const FuncionariosPage = lazy(() => import(`./features/funcionarios/pages/FuncionariosPage`).then(m => ({ default: m.FuncionariosPage })))
const InventarioPage = lazy(() => import(`./features/inventario/pages/InventarioPage`).then(m => ({ default: m.InventarioPage })))
const ApprovalsListPage = lazy(() => import(`./features/aprobaciones/pages/ApprovalsListPage`).then(m => ({ default: m.ApprovalsListPage })))
const ServiciosVeterinariaPage = lazy(() => import(`./features/servicios/pages/ServiciosVeterinariaPage`).then(m => ({ default: m.ServiciosVeterinariaPage })))
const CitasPage = lazy(() => import(`./features/citas/pages/CitasPage`).then(m => ({ default: m.CitasPage })))
const TrasladosPage = lazy(() => import(`./features/traslados/pages/TrasladosPage`).then(m => ({ default: m.TrasladosPage })))
const EmergenciasPage = lazy(() => import(`./features/emergencias/pages/EmergenciasPage`).then(m => ({ default: m.EmergenciasPage })))
const AportesPage = lazy(() => import(`./features/expediente/pages/AportesPage`).then(m => ({ default: m.AportesPage })))
const MascotasPage = lazy(() => import(`./features/mascotas/pages/MascotasPage`).then(m => ({ default: m.MascotasPage })))
const MarketplacePage = lazy(() => import(`./features/marketplace/pages/MarketplacePage`).then(m => ({ default: m.MarketplacePage })))

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <div className="page-transition" key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth-method" element={<AuthMethodPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/dashboard/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/dashboard/mascotas" element={<ProtectedRoute><MascotasPage /></ProtectedRoute>} />
        <Route path="/dashboard/veterinary-registration" element={<ProtectedRoute><VeterinaryRegistrationPage /></ProtectedRoute>} />
        <Route path="/dashboard/store-registration" element={<ProtectedRoute><StoreRegistrationPage /></ProtectedRoute>} />
        <Route path="/dashboard/funcionarios" element={<ProtectedRoute roles={FUNCIONARIOS_ROLE_IDS}><FuncionariosPage /></ProtectedRoute>} />
        <Route path="/dashboard/servicios" element={<ProtectedRoute roles={[ROLE_IDS.ADMINISTRADOR, ROLE_IDS.VETERINARIA]}><ServiciosVeterinariaPage /></ProtectedRoute>} />
        <Route path="/dashboard/citas" element={<ProtectedRoute><CitasPage /></ProtectedRoute>} />
        <Route path="/dashboard/traslados" element={<ProtectedRoute><TrasladosPage /></ProtectedRoute>} />
        <Route path="/dashboard/emergencias" element={<ProtectedRoute roles={[ROLE_IDS.CLIENTE, ROLE_IDS.VETERINARIA]}><EmergenciasPage /></ProtectedRoute>} />
        <Route path="/dashboard/aportes" element={<ProtectedRoute roles={[ROLE_IDS.CLIENTE]}><AportesPage /></ProtectedRoute>} />
        <Route path="/dashboard/inventario" element={<ProtectedRoute roles={FUNCIONARIOS_ROLE_IDS}><InventarioPage /></ProtectedRoute>} />
        <Route path="/dashboard/aprobaciones" element={<ProtectedRoute roles={[ROLE_IDS.ADMINISTRADOR]}><ApprovalsListPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <LoadingProvider>
            <Suspense fallback={<GlobalLoader />}>
              <AnimatedRoutes />
            </Suspense>
          </LoadingProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
