

// ============================================
// UTILISATEUR RÉSUMÉ
// ============================================
export interface UtilisateurResume {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  telephone?: string;
}

// ============================================
// OFFRES
// ============================================
export interface Offre {
  id: number;
  nom: string;
  description: string;
  nombre_cameras_inclus: number;
  prix_abonnement: number;
  duree_engagement_mois: number;
  actif: boolean;
}

export interface OffreCreateData {
  nom: string;
  description?: string;
  nombre_cameras_inclus: number;
  prix_abonnement: number;
  duree_engagement_mois: number;
  actif?: boolean;
}

// ============================================
// DEVIS
// ============================================
export interface LigneDevis {
  id: number;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
}

export interface LigneDevisCreateData {
  designation: string;
  quantite: number;
  prix_unitaire: number;
}

export interface Devis {
  id: number;
  montant: number;
  date_etablissement: string;
  lignes: LigneDevis[];
}

export interface DevisCreateData {
  lignes: LigneDevisCreateData[];
}

export interface DevisReponseData {
  accepte: boolean;
}

// ============================================
// SITES + FICHIERS
// ============================================
export type TypeFichier = 'PHOTO' | 'PLAN';
export type StatutSite = 'EN_ETUDE' | 'VALIDE';

export interface FichierSite {
  id: number;
  type_fichier: TypeFichier;
  fichier: string;
  date_ajout: string;
}

export interface Site {
  id: number;
  nom: string;
  adresse: string;
  adresse_gps: string;
  latitude: number | null;
  longitude: number | null;
  statut: StatutSite;
  fichiers: FichierSite[];
}

export interface SiteAdmin extends Site {
  technicien: number | null;
  technicien_nom: string | null;
  notes_faisabilite: string;
}

export interface SiteTechnicien extends Site {
  notes_faisabilite: string;
  demande: DemandeResume;
}

export interface SiteEtudeData {
  notes_faisabilite: string;
  valider: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

// ============================================
// DEMANDES
// ============================================
export type StatutDemande = 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE';

export interface DemandeResume {
  id: number;
  description: string;
  statut: StatutDemande;
  client: UtilisateurResume;
  offre: Offre;
}

export interface DemandeClient {
  id: number;
  date_soumission: string;
  statut: StatutDemande;
  description: string;
  offre: Offre;
  sites: Site[];
  devis: Devis | null;
}

export interface DemandeAdmin {
  id: number;
  date_soumission: string;
  statut: StatutDemande;
  description: string;
  client: UtilisateurResume;
  offre: Offre;
  sites: SiteAdmin[];
  devis: Devis | null;
}

export interface DemandeCreateData {
  offre: number;
  description: string;
  nom_site: string;
  adresse: string;
  photos?: File[];
  plans?: File[];
}

// ============================================
// INSTALLATIONS + ÉQUIPEMENTS
// ============================================
export type StatutInstallation = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE';
export type TypeEquipement = 'CAMERA' | 'NVR_DVR';
export type StatutEquipement = 'ACTIF' | 'EN_PANNE' | 'HORS_SERVICE';

export interface Equipement {
  id: number;
  type_equipement: TypeEquipement;
  model: string;
  adresse_ip: string | null;
  statut: StatutEquipement;
  date_debut_garantie: string;
  date_fin_garantie: string;
  garantie_expiree: boolean;
  garantie_jours_restants: number;
  site_nom: string;
  client_nom: string;
  installation: number;
}

export interface EquipementCreateData {
  type_equipement: TypeEquipement;
  model: string;
  adresse_ip?: string | null;
  date_debut_garantie: string;
  date_fin_garantie: string;
}

export interface FichierInstallation {
  id: number;
  fichier: string;
  date_ajout: string;
}

export interface InstallationAdmin {
  id: number;
  date_installation: string | null;
  statut: StatutInstallation;
  site_nom: string;
  adresse: string;
  client_nom: string;
  technicien: number;
  technicien_nom: string | null;
  equipements: Equipement[];
}

export interface InstallationTechnicien {
  id: number;
  date_installation: string | null;
  statut: StatutInstallation;
  site_nom: string;
  adresse: string;
  client_nom: string;
  equipements: Equipement[];
  fichiers: FichierInstallation[];
}

export interface InstallationCreateData {
  site: number;
  technicien: number;
  date_installation?: string | null;
}

// ============================================
// RAPPORT D'INSTALLATION
// ============================================
export interface RapportInstallation {
  id: number;
  contenu: string;
  date_creation: string;
  validation_client: boolean;
  date_validation: string | null;
}

// ============================================
// COMMENTAIRES
// ============================================
export type VisibiliteCommentaire = 'INTERNE' | 'PUBLIC';

export interface Commentaire {
  id: number;
  contenu: string;
  visibilite: VisibiliteCommentaire;
  auteur: UtilisateurResume;
  date: string;
  peut_supprimer: boolean;
}

export interface CommentaireCreateData {
  contenu: string;
  visibilite: VisibiliteCommentaire;
}

// ============================================
// NOTIFICATIONS (partagé avec Smart Ticket)
// ============================================
export interface Notification {
  id: number;
  message: string;
  lien: string;
  lu: boolean;
  date: string;
}