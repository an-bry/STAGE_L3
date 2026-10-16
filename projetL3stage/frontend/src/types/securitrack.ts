// Types SECURITRACK — alignés sur les serializers DRF
// (les plus complets — équipements, contrats, maintenances, alertes, dashboard)

export type EtatContrat = 'ACTIF' | 'BIENTOT_EXPIRE' | 'EXPIRE';
export type StatutMaintenance = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE';
export type TypeMaintenance = 'PREVENTIVE' | 'CORRECTIVE';
export type StatutEquipement = 'ACTIF' | 'EN_PANNE' | 'HORS_SERVICE';
export type RoleUtilisateur = 'ADMIN' | 'TECHNICIEN' | 'CLIENT';

export interface Utilisateur {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: RoleUtilisateur;
  telephone?: string;
  raison_sociale?: string;
  specialite?: string;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface EquipementResume {
  id: number;
  type_equipement: string;
  model: string;
  adresse_ip: string | null;
  statut: StatutEquipement;
  date_fin_garantie: string;
}
export interface Equipement extends EquipementResume {
  date_debut_garantie: string;
  garantie_expiree: boolean;
  garantie_jours_restants: number;
  installation: number;
  installation_statut: string;
  site: number;
  site_nom: string;
  client: number;
  client_nom: string;
  demande: number;
  nb_maintenances: number;
}
export interface Contrat {
  id: number;
  client: number;
  client_nom: string;
  date_debut: string;
  date_fin: string;
  equipements: number[];
  equipements_detail: EquipementResume[];
  etat: EtatContrat;
}

export interface Maintenance {
  id: number;
  type_maintenance: TypeMaintenance;
  statut: StatutMaintenance;
  date: string;
  compte_rendu: string;
  technicien: number | null;
  technicien_nom: string | null;
  equipement: number;
  equipement_detail: EquipementResume;
  site_nom: string;
  client_nom: string;
  en_retard: boolean;
}

export interface Site {
  id: number;
  nom: string;
  adresse: string;
  adresse_gps: string;
  latitude: number | null;
  longitude: number | null;
  statut: string;
  notes_faisabilite: string;
  technicien: number | null;
  technicien_nom: string | null;
  demande: number;
  demande_statut: string;
  client_nom: string;
  date_soumission: string;
  nb_installations: number;
  fichiers: { id: number; fichier: string }[];
}

export interface Alertes {
  horizon_jours: number;
  resume: {
    contrats_bientot_expires: number;
    equipements_sans_contrat: number;
    garanties_bientot_expirees: number;
    equipements_en_panne: number;
    maintenances_en_retard: number;
    maintenances_a_venir: number;
  };
  urgent: number;
  contrats_bientot_expires: Contrat[];
  equipements_sans_contrat: Equipement[];
  garanties_bientot_expirees: Equipement[];
  equipements_en_panne: Equipement[];
  maintenances_en_retard: Maintenance[];
  maintenances_a_venir: Maintenance[];
}

export interface Dashboard {
  date: string;
  seuil_jours: number;
  alertes: {
    urgent: number;
    maintenances_en_retard: number;
    equipements_en_panne: number;
    equipements_sans_contrat: number;
    contrats_bientot_expires: number;
    garanties_bientot_expirees: number;
  };
  utilisateurs: { clients: number; techniciens: number; admins: number; desactives: number };
  contrats: {
    total: number;
    actifs: number;
    bientot_expires: number;
    expires: number;
    clients_equipes_sans_contrat: number;
  };
  equipements: {
    total: number;
    par_statut: Record<string, number>;
    par_type: Record<string, number>;
    taux_actifs: number | null;
    sans_contrat: number;
    garantie: { valide: number; bientot_expiree: number; expiree: number };
  };
  maintenances: {
    par_statut: Record<StatutMaintenance, number>;
    en_retard: number;
    taux_realisation: number | null;
    ce_mois: { total: number; terminees: number; planifiees: number; en_cours: number };
    evolution_6_mois: Array<{ mois: string; total: number; terminees: number }>;
    charge_techniciens: Array<{ technicien: number; nom: string; maintenances_ouvertes: number }>;
  };
  tickets: {
    total: number;
    ouverts: number;
    par_statut: Record<string, number>;
    ouverts_par_priorite: Record<string, number>;
    sla_depasse: number;
    ouverts_sur_equipement: number;
    ouverts_sans_equipement_lie: number;
    equipements_les_plus_en_panne: Array<{
      equipement: number;
      model: string;
      type: string;
      nb_tickets: number;
    }>;
  };
  camtrack: {
    demandes: Record<string, number>;
    sites: Record<string, number>;
    installations: Record<string, number>;
    rapports_non_valides: number;
  };
}

export type TypeEvenement =
  | 'INSTALLATION'
  | 'MAINTENANCE_PREVENTIVE'
  | 'CONTRAT'
  | 'TICKET'
  | 'INTERVENTION';

export interface EvenementHistorique {
  date: string;
  type: TypeEvenement;
  id?: number;
  ticket?: number;
  libelle: string;
  statut: string;
  technicien?: string | null;
  detail: string;
}

export interface HistoriqueEquipement {
  equipement: Equipement;
  resume: {
    nb_maintenances: number;
    nb_terminees: number;
    derniere_maintenance: string | null;
    prochaine_maintenance: string | null;
    nb_tickets: number;
    nb_tickets_ouverts: number;
  };
  chronologie: EvenementHistorique[];
}