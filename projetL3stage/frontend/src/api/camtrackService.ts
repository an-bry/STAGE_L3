import api from './axiosConfig';
import type {
  Offre,
  OffreCreateData,
  DemandeClient,
  DemandeAdmin,
  DemandeCreateData,
  Devis,
  DevisCreateData,
  DevisReponseData,
  SiteAdmin,
  SiteTechnicien,
  SiteEtudeData,
  InstallationAdmin,
  InstallationTechnicien,
  InstallationCreateData,
  Equipement,
  EquipementCreateData,
  FichierInstallation,
  RapportInstallation,
  Commentaire,
  CommentaireCreateData,
} from '../types/camtrack';

// ============================================
// BASE URL
// ============================================
const BASE = '/camtrack';

// ============================================
// OFFRES
// ============================================
export const getOffres = async (): Promise<Offre[]> => {
  const response = await api.get(`${BASE}/offres/`);
  return response.data;
};

export const getOffresAdmin = async (actif?: boolean): Promise<Offre[]> => {
  const response = await api.get(`${BASE}/offres/admin/`, {
    params: actif !== undefined ? { actif: actif.toString() } : undefined,
  });
  return response.data;
};

export const creerOffre = async (data: OffreCreateData): Promise<Offre> => {
  const response = await api.post(`${BASE}/offres/admin/`, data);
  return response.data;
};

export const modifierOffre = async (id: number, data: Partial<OffreCreateData>): Promise<Offre> => {
  const response = await api.patch(`${BASE}/offres/admin/${id}/`, data);
  return response.data;
};

export const supprimerOffre = async (id: number): Promise<void> => {
  await api.delete(`${BASE}/offres/admin/${id}/`);
};

// ============================================
// DEMANDES
// ============================================
export const creerDemande = async (data: DemandeCreateData): Promise<DemandeClient> => {
  const formData = new FormData();
  formData.append('offre', data.offre.toString());
  formData.append('description', data.description);
  formData.append('nom_site', data.nom_site);
  formData.append('adresse', data.adresse);

  if (data.photos) {
    data.photos.forEach((photo) => formData.append('photos', photo));
  }
  if (data.plans) {
    data.plans.forEach((plan) => formData.append('plans', plan));
  }

  const response = await api.post(`${BASE}/demandes/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getMesDemandes = async (): Promise<DemandeClient[]> => {
  const response = await api.get(`${BASE}/demandes/mes-demandes/`);
  return response.data;
};

export const getToutesLesDemandes = async (statut?: string): Promise<DemandeAdmin[]> => {
  const response = await api.get(`${BASE}/demandes/admin/`, {
    params: statut ? { statut } : undefined,
  });
  return response.data;
};

export const getDemandeAdmin = async (id: number): Promise<DemandeAdmin> => {
  const response = await api.get(`${BASE}/demandes/admin/${id}/`);
  return response.data;
};

export const rejeterDemande = async (id: number): Promise<DemandeAdmin> => {
  const response = await api.patch(`${BASE}/demandes/admin/${id}/rejeter/`);
  return response.data;
};

// ============================================
// DEVIS
// ============================================
export const creerDevis = async (demandeId: number, data: DevisCreateData): Promise<Devis> => {
  const response = await api.post(`${BASE}/demandes/admin/${demandeId}/devis/`, data);
  return response.data;
};

export const repondreDevis = async (devisId: number, data: DevisReponseData): Promise<DemandeClient> => {
  const response = await api.patch(`${BASE}/devis/${devisId}/repondre/`, data);
  return response.data;
};

// ============================================
// SITES / ÉTUDES
// ============================================
export const affecterTechnicienSite = async (siteId: number, technicienId: number): Promise<SiteAdmin> => {
  const response = await api.patch(`${BASE}/sites/admin/${siteId}/affecter/`, {
    technicien: technicienId,
  });
  return response.data;
};

export const getMesEtudes = async (statut?: string): Promise<SiteTechnicien[]> => {
  const response = await api.get(`${BASE}/sites/technicien/mes-etudes/`, {
    params: statut ? { statut } : undefined,
  });
  return response.data;
};

export const etudierSite = async (siteId: number, data: SiteEtudeData): Promise<SiteTechnicien> => {
  const response = await api.patch(`${BASE}/sites/technicien/${siteId}/etude/`, data);
  return response.data;
};

// ============================================
// INSTALLATIONS
// ============================================
export const getInstallationsAdmin = async (statut?: string): Promise<InstallationAdmin[]> => {
  const response = await api.get(`${BASE}/installations/admin/`, {
    params: statut ? { statut } : undefined,
  });
  return response.data;
};

export const getInstallationAdmin = async (id: number): Promise<InstallationAdmin> => {
  const response = await api.get(`${BASE}/installations/admin/${id}/`);
  return response.data;
};

export const creerInstallation = async (data: InstallationCreateData): Promise<InstallationAdmin> => {
  const response = await api.post(`${BASE}/installations/admin/creer/`, data);
  return response.data;
};

export const getMesInstallations = async (statut?: string): Promise<InstallationTechnicien[]> => {
  const response = await api.get(`${BASE}/installations/technicien/mes-installations/`, {
    params: statut ? { statut } : undefined,
  });
  return response.data;
};

export const demarrerInstallation = async (id: number): Promise<InstallationTechnicien> => {
  const response = await api.patch(`${BASE}/installations/technicien/${id}/demarrer/`);
  return response.data;
};

export const terminerInstallation = async (id: number): Promise<InstallationTechnicien> => {
  const response = await api.patch(`${BASE}/installations/technicien/${id}/terminer/`);
  return response.data;
};

// ============================================
// ÉQUIPEMENTS
// ============================================
export const getEquipementsInstallation = async (installationId: number): Promise<Equipement[]> => {
  const response = await api.get(`${BASE}/installations/${installationId}/equipements/`);
  return response.data;
};

export const ajouterEquipement = async (
  installationId: number,
  data: EquipementCreateData
): Promise<Equipement> => {
  const response = await api.post(`${BASE}/installations/${installationId}/equipements/`, data);
  return response.data;
};

export const getEquipementsGarantie = async (params?: {
  expiree?: boolean;
  expire_bientot?: number;
}): Promise<Equipement[]> => {
  const query: any = {};
  if (params?.expiree) query.expiree = 'true';
  if (params?.expire_bientot) query.expire_bientot = params.expire_bientot.toString();

  const response = await api.get(`${BASE}/equipements/admin/garantie/`, { params: query });
  return response.data;
};

// ============================================
// PHOTOS
// ============================================
export const getPhotosInstallation = async (installationId: number): Promise<FichierInstallation[]> => {
  const response = await api.get(`${BASE}/installations/${installationId}/photos/`);
  return response.data;
};

export const ajouterPhotoInstallation = async (
  installationId: number,
  fichier: File
): Promise<FichierInstallation> => {
  const formData = new FormData();
  formData.append('fichier', fichier);

  const response = await api.post(`${BASE}/installations/${installationId}/photos/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// ============================================
// RAPPORT
// ============================================
export const getRapportInstallation = async (installationId: number): Promise<RapportInstallation> => {
  const response = await api.get(`${BASE}/installations/${installationId}/rapport/`);
  return response.data;
};

export const validerInstallation = async (installationId: number): Promise<RapportInstallation> => {
  const response = await api.patch(`${BASE}/installations/${installationId}/valider/`);
  return response.data;
};

export const telechargerRapportInstallationPDF = async (installationId: number) => {
  const response = await api.get(
    `${BASE}/installations/${installationId}/rapport/pdf/`,
    { responseType: 'blob' }
  );

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rapport_installation_${installationId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// ============================================
// COMMENTAIRES
// ============================================
export const getCommentairesDemande = async (demandeId: number): Promise<Commentaire[]> => {
  const response = await api.get(`${BASE}/demandes/${demandeId}/commentaires/`);
  return response.data;
};

export const ajouterCommentaireDemande = async (
  demandeId: number,
  data: CommentaireCreateData
): Promise<Commentaire> => {
  const response = await api.post(`${BASE}/demandes/${demandeId}/commentaires/`, data);
  return response.data;
};

export const supprimerCommentaire = async (commentaireId: number): Promise<void> => {
  await api.delete(`${BASE}/commentaires/${commentaireId}/`);
};