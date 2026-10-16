import { Route } from 'react-router-dom';
import RoleRoute from './RoleRoute';
import DashboardAdminPage from '../pages/securitrack/admin/DashboardAdminPage';
import EquipementsPage from '../pages/securitrack/admin/EquipementsPage';
import EquipementDetailPage from '../pages/securitrack/admin/EquipementDetailPage';
import ContratsPage from '../pages/securitrack/admin/ContratsPage';
import MaintenancesPage from '../pages/securitrack/admin/MaintenancesPage';
import AlertesPage from '../pages/securitrack/admin/AlertesPage';
import UtilisateursPage from '../pages/securitrack/admin/UtilisateursPage';
import MesMaintenancesPage from '../pages/securitrack/technicien/MesMaintenancesPage';
import SitesPage from '../pages/securitrack/admin/SitesPage';
import SiteDetailPage from '../pages/securitrack/admin/SiteDetailPage';
import MesContratsPage from '../pages/securitrack/client/MesContratsPage';
import MesEquipementsPage from '../pages/securitrack/client/MesEquipementsPage';
import MesEquipementDetailPage from '../pages/securitrack/client/MesEquipementDetailPage';
import MesSitesPage from '../pages/securitrack/client/MesSitesPage';
import ContratDetailPage from '../pages/securitrack/admin/ContratDetailPage';
function Placeholder({ titre }: { titre: string }) {
  return (
    <div className="p-8">
      <div className="bg-card border border-line rounded-lg p-8 text-center max-w-md mx-auto">
        <p className="text-sm font-medium text-ink">{titre}</p>
        <p className="text-xs text-ink-faint mt-1">Écran en cours de construction.</p>
      </div>
    </div>
  );
}

export const securitrackRoutes = [
  // ═══════════════ ADMIN ═══════════════
  <Route key="st-admin-dashboard" path="/securitrack/admin/dashboard" element={<RoleRoute allowedRoles={['ADMIN']}><DashboardAdminPage /></RoleRoute>} />,
  <Route key="st-admin-alertes" path="/securitrack/admin/alertes" element={<RoleRoute allowedRoles={['ADMIN']}><AlertesPage /></RoleRoute>} />,

  <Route key="st-admin-users" path="/securitrack/admin/utilisateurs" element={<RoleRoute allowedRoles={['ADMIN']}><UtilisateursPage /></RoleRoute>} />,
  <Route key="st-admin-user-detail" path="/securitrack/admin/utilisateurs/:id" element={<RoleRoute allowedRoles={['ADMIN']}><Placeholder titre="Fiche utilisateur" /></RoleRoute>} />,

  <Route key="st-admin-eq" path="/securitrack/admin/equipements" element={<RoleRoute allowedRoles={['ADMIN']}><EquipementsPage /></RoleRoute>} />,
  <Route key="st-admin-eq-detail" path="/securitrack/admin/equipements/:id" element={<RoleRoute allowedRoles={['ADMIN']}><EquipementDetailPage /></RoleRoute>} />,

  <Route key="st-admin-contrats" path="/securitrack/admin/contrats" element={<RoleRoute allowedRoles={['ADMIN']}><ContratsPage /></RoleRoute>} />,
  <Route key="st-admin-contrat-new" path="/securitrack/admin/contrats/nouveau" element={<RoleRoute allowedRoles={['ADMIN']}><Placeholder titre="Nouveau contrat" /></RoleRoute>} />,
  <Route key="st-admin-contrat-detail" path="/securitrack/admin/contrats/:id" element={<RoleRoute allowedRoles={['ADMIN']}><ContratDetailPage /></RoleRoute>} />,

  <Route key="st-admin-maint" path="/securitrack/admin/maintenances" element={<RoleRoute allowedRoles={['ADMIN']}><MaintenancesPage /></RoleRoute>} />,
  <Route key="st-admin-maint-new" path="/securitrack/admin/maintenances/nouvelle" element={<RoleRoute allowedRoles={['ADMIN']}><Placeholder titre="Nouvelle maintenance" /></RoleRoute>} />,

<Route key="st-admin-sites" path="/securitrack/admin/sites" element={<RoleRoute allowedRoles={['ADMIN']}><SitesPage /></RoleRoute>} />,
<Route key="st-admin-site-detail" path="/securitrack/admin/sites/:id" element={<RoleRoute allowedRoles={['ADMIN']}><SiteDetailPage /></RoleRoute>} />,

  // ═══════════════ CLIENT ═══════════════
 <Route key="st-client-contrats" path="/securitrack/client/contrats" element={<RoleRoute allowedRoles={['CLIENT']}><MesContratsPage /></RoleRoute>} />,
<Route key="st-client-eq" path="/securitrack/client/equipements" element={<RoleRoute allowedRoles={['CLIENT']}><MesEquipementsPage /></RoleRoute>} />,
<Route key="st-client-eq-detail" path="/securitrack/client/equipements/:id" element={<RoleRoute allowedRoles={['CLIENT']}><MesEquipementDetailPage /></RoleRoute>} />,
<Route key="st-client-maint" path="/securitrack/client/maintenances" element={<RoleRoute allowedRoles={['CLIENT']}><MesMaintenancesPage /></RoleRoute>} />,
<Route key="st-client-sites" path="/securitrack/client/sites" element={<RoleRoute allowedRoles={['CLIENT']}><MesSitesPage /></RoleRoute>} />,
  // ═══════════════ TECHNICIEN ═══════════════
  <Route key="st-tech-maint" path="/securitrack/technicien/maintenances" element={<RoleRoute allowedRoles={['TECHNICIEN']}><MesMaintenancesPage /></RoleRoute>} />,
];