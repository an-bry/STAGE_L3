import api from '../axiosConfig';
import type {
  Alertes, Contrat, Dashboard, Equipement, HistoriqueEquipement,
  Maintenance, Site, Utilisateur,
} from '../../types/securitrack';

// ⚠️ Vérifie ce préfixe selon ton urls.py Django racine
const BASE = '/securitrack';

export const utilisateursApi = {
  list: (params?: { role?: string; actif?: boolean; search?: string }) =>
    api.get<Utilisateur[]>(`${BASE}/utilisateurs/`, { params }).then(r => r.data),
  get: (id: number) =>
    api.get<Utilisateur>(`${BASE}/utilisateurs/${id}/`).then(r => r.data),
  create: (payload: any) =>
    api.post<Utilisateur>(`${BASE}/utilisateurs/`, payload).then(r => r.data),
  update: (id: number, payload: Partial<Utilisateur>) =>
    api.patch<Utilisateur>(`${BASE}/utilisateurs/${id}/`, payload).then(r => r.data),
  delete: (id: number) => api.delete(`${BASE}/utilisateurs/${id}/`),
  liens: (id: number) =>
    api.get<{ peut_supprimer: boolean; liens: Record<string, number> }>(
      `${BASE}/utilisateurs/${id}/liens/`
    ).then(r => r.data),
  resetPassword: (id: number, nouveau_mot_de_passe: string) =>
    api.patch(`${BASE}/utilisateurs/${id}/mot-de-passe/`, { nouveau_mot_de_passe }),
};

export const contratsApi = {
  list: (params?: { client?: number; etat?: string }) =>
    api.get<Contrat[]>(`${BASE}/contrats/`, { params }).then(r => r.data),
  get: (id: number) =>
    api.get<Contrat>(`${BASE}/contrats/${id}/`).then(r => r.data),
  create: (payload: any) =>
    api.post<Contrat>(`${BASE}/contrats/`, payload).then(r => r.data),
  update: (id: number, payload: any) =>
    api.patch<Contrat>(`${BASE}/contrats/${id}/`, payload).then(r => r.data),
  mesContrats: () =>
    api.get<Contrat[]>(`${BASE}/mes-contrats/`).then(r => r.data),
};

export const equipementsApi = {
  list: (params?: {
    statut?: string; type?: string; client?: number; site?: number;
    installation?: number; garantie?: string; search?: string;
  }) => api.get<Equipement[]>(`${BASE}/equipements/`, { params }).then(r => r.data),
  get: (id: number) =>
    api.get<Equipement>(`${BASE}/equipements/${id}/`).then(r => r.data),
  update: (id: number, payload: any) =>
    api.patch<Equipement>(`${BASE}/equipements/${id}/`, payload).then(r => r.data),
  delete: (id: number) => api.delete(`${BASE}/equipements/${id}/`),
  historique: (id: number) =>
    api.get<HistoriqueEquipement>(`${BASE}/equipements/${id}/historique/`).then(r => r.data),
  mesEquipements: (params?: { statut?: string }) =>
    api.get<Equipement[]>(`${BASE}/mes-equipements/`, { params }).then(r => r.data),
};

export const maintenancesApi = {
  list: (params?: any) =>
    api.get<Maintenance[]>(`${BASE}/maintenances/`, { params }).then(r => r.data),
  get: (id: number) =>
    api.get<Maintenance>(`${BASE}/maintenances/${id}/`).then(r => r.data),
  create: (payload: any) =>
    api.post<Maintenance>(`${BASE}/maintenances/`, payload).then(r => r.data),
  update: (id: number, payload: any) =>
    api.patch<Maintenance>(`${BASE}/maintenances/${id}/`, payload).then(r => r.data),
  delete: (id: number) => api.delete(`${BASE}/maintenances/${id}/`),
  demarrer: (id: number) =>
    api.patch<Maintenance>(`${BASE}/maintenances/${id}/demarrer/`).then(r => r.data),
  terminer: (id: number, compte_rendu: string) =>
    api.patch<Maintenance>(`${BASE}/maintenances/${id}/terminer/`, { compte_rendu }).then(r => r.data),
  mesMaintenances: (params?: { statut?: string }) =>
    api.get<Maintenance[]>(`${BASE}/mes-maintenances/`, { params }).then(r => r.data),
};

export const sitesApi = {
  list: (params?: any) =>
    api.get<Site[]>(`${BASE}/sites/`, { params }).then(r => r.data),
  get: (id: number) =>
    api.get<Site>(`${BASE}/sites/${id}/`).then(r => r.data),
  update: (id: number, payload: any) =>
    api.patch<Site>(`${BASE}/sites/${id}/`, payload).then(r => r.data),
  delete: (id: number) => api.delete(`${BASE}/sites/${id}/`),
  mesSites: () =>
    api.get<Site[]>(`${BASE}/mes-sites/`).then(r => r.data),
};

export const alertesApi = {
  get: (jours = 30) =>
    api.get<Alertes>(`${BASE}/alertes/`, { params: { jours } }).then(r => r.data),
  envoyer: (jours = 30, dry_run = false) =>
    api.post(`${BASE}/alertes/envoyer/`, { jours, dry_run }).then(r => r.data),
};

export const dashboardApi = {
  get: () => api.get<Dashboard>(`${BASE}/tableau-de-bord/`).then(r => r.data),
};

// ── Liste des clients (pour les selects) ──
export const clientsApi = {
  list: () => api.get<Utilisateur[]>('/securitrack/utilisateurs/', {
    params: { role: 'CLIENT', actif: true }
  }).then(r => r.data),
};

// ── Liste des techniciens (pour les selects) ──
export const techniciensApi = {
  list: () => api.get<Utilisateur[]>('/securitrack/utilisateurs/', {
    params: { role: 'TECHNICIEN', actif: true }
  }).then(r => r.data),
};