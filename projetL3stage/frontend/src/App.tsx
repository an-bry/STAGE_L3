import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RoleRoute from './routes/RoleRoute';
import DashboardPage from './pages/DashboardPage';
import MesInstallationsClientPage from './pages/camtrack/client/MesInstallationsClientPage';
import InstallationClientDetailPage from './pages/camtrack/client/InstallationClientDetailPage';
// ============ SMART TICKET ============
import ClientTicketsPage from './pages/client/ClientTicketsPage';
import ClientTicketSuiviPage from './pages/client/ClientTicketSuiviPage';
import AdminTicketsPage from './pages/admin/AdminTicketsPage';
import AdminTicketDetailPage from './pages/admin/Adminticketdetail';
import TechnicienTicketsPage from './pages/technicien/TechnicienTicketsPage';
import TechnicienTicketDetailPage from './pages/technicien/Technicienticketdetailpage';
import CatalogueOffresPage from './pages/camtrack/client/CatalogueOffresPage';
import NouvelleDemandePage from './pages/camtrack/client/NouvelleDemandePage';
import DemandesPage from './pages/camtrack/client/DemandesPage';
import DemandeDetailPage from './pages/camtrack/client/DemandeDetailPage';
import MesEtudesPage from './pages/camtrack/technicien/MesEtudesPage';
import EtudeDetailPage from './pages/camtrack/technicien/EtudeDetailPage';
import DemandesAdminPage from './pages/camtrack/admin/DemandesAdminPage';
import DemandeAdminDetailPage from './pages/camtrack/admin/DemandeAdminDetailPage';
import OffresAdminPage from './pages/camtrack/admin/OffresAdminPage';
import InstallationsAdminPage from './pages/camtrack/admin/InstallationsAdminPage';
import GarantiesAdminPage from './pages/camtrack/admin/GarantiesAdminPage';
import MesInstallationsPage from './pages/camtrack/technicien/MesInstallationsPage';
import InstallationDetailPage from './pages/camtrack/technicien/InstallationDetailPage';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8">Chargement...</div>;
  if (!user) return <Navigate to="/login" />;
  return <Navigate to="/dashboard" />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* === AUTH (publiques) === */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />

          {/* === DASHBOARD === */}
          <Route
            path="/dashboard"
            element={
              <RoleRoute allowedRoles={['CLIENT', 'ADMIN', 'TECHNICIEN']}>
                <DashboardPage />
              </RoleRoute>
            }
          />

          {/* ============================================ */}
          {/* ============ SMART TICKET ============ */}
          {/* ============================================ */}

          {/* Client */}
          <Route
            path="/smart-ticket/client/tickets"
            element={
              <RoleRoute allowedRoles={['CLIENT']}>
                <ClientTicketsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/smart-ticket/client/tickets/:id"
            element={
              <RoleRoute allowedRoles={['CLIENT']}>
                <ClientTicketSuiviPage />
              </RoleRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/smart-ticket/admin/tickets"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminTicketsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/smart-ticket/admin/tickets/:id"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminTicketDetailPage />
              </RoleRoute>
            }
          />

          {/* Technicien */}
          <Route
            path="/smart-ticket/technicien/tickets"
            element={
              <RoleRoute allowedRoles={['TECHNICIEN']}>
                <TechnicienTicketsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/smart-ticket/technicien/tickets/:id"
            element={
              <RoleRoute allowedRoles={['TECHNICIEN']}>
                <TechnicienTicketDetailPage />
              </RoleRoute>
            }
          />

          {/* ============================================ */}
{/* ============ CAMTRACK CLIENT ============ */}
{/* ============================================ */}

<Route
  path="/camtrack/client/offres"
  element={
    <RoleRoute allowedRoles={['CLIENT']}>
      <CatalogueOffresPage />
    </RoleRoute>
  }
/>
<Route
  path="/camtrack/client/demandes"
  element={
    <RoleRoute allowedRoles={['CLIENT']}>
      <DemandesPage />
    </RoleRoute>
  }
/>
<Route
  path="/camtrack/client/demandes/nouvelle"
  element={
    <RoleRoute allowedRoles={['CLIENT']}>
      <NouvelleDemandePage />
    </RoleRoute>
  }
/>
<Route
  path="/camtrack/client/demandes/:id"
  element={
    <RoleRoute allowedRoles={['CLIENT']}>
      <DemandeDetailPage />
    </RoleRoute>
  }
/>
<Route
  path="/camtrack/client/installations"
  element={
    <RoleRoute allowedRoles={['CLIENT']}>
      <MesInstallationsClientPage />
    </RoleRoute>
  }
/>
<Route
  path="/camtrack/client/installations/:id"
  element={
    <RoleRoute allowedRoles={['CLIENT']}>
      <InstallationClientDetailPage />
    </RoleRoute>
  }
/>
{/* ============================================ */}
{/* ============ CAMTRACK TECHNICIEN ============ */}
{/* ============================================ */}

<Route
  path="/camtrack/technicien/etudes"
  element={
    <RoleRoute allowedRoles={['TECHNICIEN']}>
      <MesEtudesPage />
    </RoleRoute>
  }
/>
<Route
  path="/camtrack/technicien/etudes/:id"
  element={
    <RoleRoute allowedRoles={['TECHNICIEN']}>
      <EtudeDetailPage />
    </RoleRoute>
  }
/>
{/* ============================================ */}
{/* ============ CAMTRACK ADMIN ============ */}
{/* ============================================ */}

<Route
  path="/camtrack/admin/demandes"
  element={
    <RoleRoute allowedRoles={['ADMIN']}>
      <DemandesAdminPage />
    </RoleRoute>
  }
/>
<Route
  path="/camtrack/admin/demandes/:id"
  element={
    <RoleRoute allowedRoles={['ADMIN']}>
      <DemandeAdminDetailPage />
    </RoleRoute>
  }
/>
<Route
  path="/camtrack/admin/offres"
  element={
    <RoleRoute allowedRoles={['ADMIN']}>
      <OffresAdminPage />
    </RoleRoute>
  }
/>
<Route
  path="/camtrack/admin/installations"
  element={
    <RoleRoute allowedRoles={['ADMIN']}>
      <InstallationsAdminPage />
    </RoleRoute>
  }
/>
<Route
  path="/camtrack/admin/garanties"
  element={
    <RoleRoute allowedRoles={['ADMIN']}>
      <GarantiesAdminPage />
    </RoleRoute>
  }
/>
{/* ============================================ */}
{/* ============ CAMTRACK TECHNICIEN - INSTALLATIONS ============ */}
{/* ============================================ */}

<Route
  path="/camtrack/technicien/installations"
  element={
    <RoleRoute allowedRoles={['TECHNICIEN']}>
      <MesInstallationsPage />
    </RoleRoute>
  }
/>
<Route
  path="/camtrack/technicien/installations/:id"
  element={
    <RoleRoute allowedRoles={['TECHNICIEN']}>
      <InstallationDetailPage />
    </RoleRoute>
  }
/>

          {/* === FALLBACK === */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;