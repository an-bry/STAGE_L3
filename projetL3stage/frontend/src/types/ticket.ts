import type { Utilisateur } from './user';

// Version allégée d'un utilisateur
export type UtilisateurResume = Pick<
  Utilisateur,
  'id' | 'username' | 'first_name' | 'last_name' | 'telephone'
>;

// === TYPES ===
export type TicketPriorite = 'FAIBLE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE';
export type TicketStatut =
  | 'BROUILLON'
  | 'NOUVEAU'
  | 'A_QUALIFIER'
  | 'AFFECTE'
  | 'PLANIFIE'
  | 'EN_COURS'
  | 'EN_ATTENTE'
  | 'RESOLU'
  | 'CLOTURE';
export type TicketImpact = 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'CRITIQUE';
export type InterventionStatut = 'EN_COURS' | 'TERMINEE' | 'VALIDEE';
export type RapportType = 'INSTALLATION' | 'INTERVENTION';
export type VisibiliteCommentaire = 'INTERNE' | 'PUBLIC';
export type StatutPlanification = 'PLANIFIEE' | 'ANNULEE';
export type StatutPiece = 'REMPLACEE' | 'REPAREE' | 'A_COMMANDER';

// === CHAMPS ENRICHIS COMMUNS ===
export interface TicketChampsEnrichis {
  categorie: string;
  equipement: string;
  site: string;
  localisation_precise: string;
  niveau_impact: TicketImpact;
  nombre_utilisateurs_affectes: number;
  date_heure_apparition: string | null;
  disponibilites_client: string;
  sla_deadline: string | null;
  sla_restant: number | null; // en secondes
  sla_depasse: boolean;
}

// === TICKET : Vue Client simple ===
export interface Ticket extends TicketChampsEnrichis {
  id: number;
  date_creation: string;
  priorite: TicketPriorite;
  statut: TicketStatut;
  description: string;
  client: number;
  technicien: number | null;
}

// === TICKET : Vue Admin ===
export interface TicketAdmin extends TicketChampsEnrichis {
  id: number;
  date_creation: string;
  priorite: TicketPriorite;
  statut: TicketStatut;
  description: string;
  client: UtilisateurResume;
  technicien: UtilisateurResume | null;
  priorite_modifiee_manuellement: boolean;
  interventions?: InterventionSuivi[];
}

// === TICKET : Vue Technicien ===
export interface TicketTechnicien extends TicketChampsEnrichis {
  id: number;
  date_creation: string;
  priorite: TicketPriorite;
  statut: TicketStatut;
  description: string;
  client: UtilisateurResume;
}

// === CRÉATION TICKET ===
export interface TicketCreateData {
  description: string;
  categorie?: string;
  equipement?: string;
  site?: string;
  localisation_precise?: string;
  niveau_impact?: TicketImpact;
  nombre_utilisateurs_affectes?: number;
  date_heure_apparition?: string | null;
  disponibilites_client?: string;
}

// === AFFECTATION ===
export interface TicketAffecterData {
  technicien: number;
}

// === PIÈCE CATALOGUE ===
export interface Piece {
  id: number;
  reference: string;
  designation: string;
  stock_actuel: number;
  lieu_stockage: string;
  prix_unitaire: number;
}

// === PIÈCE UTILISÉE (lecture) ===
export interface PieceUtilisee {
  id: number;
  nom: string;
  reference: string;
  quantite: number;
  prix_unitaire: number;
  cout_total: number;
  intervention: number;
  piece: Piece | null;
  numero_serie: string;
  statut_piece: StatutPiece;
  piece_recuperee: boolean;
}
// === PIÈCE DEMANDÉE (Technicien, avant devis) ===
export interface PieceDemandee {
  id: number;
  piece: number | null;
  nom: string;
  reference: string;
  quantite: number;
}

// === PIÈCE UTILISÉE (création) ===
export interface PieceUtiliseeCreateData {
  nom?: string;
  reference?: string;
  quantite: number;
  prix_unitaire?: number;
  piece?: number | null;
  numero_serie?: string;
  statut_piece?: StatutPiece;
  piece_recuperee?: boolean;
}

// === RAPPORT ===
export interface Rapport {
  id: number;
  contenu: string;
  type_rapport: RapportType;
  date_creation: string;
}

// === INTERVENTION (lecture simple) ===
export interface Intervention {
  id: number;
  date: string;
  statut: InterventionStatut;
  diagnostic: string;
  validation_client: boolean;
  technicien: UtilisateurResume;
  ticket: number;
  symptomes_constates: string;
  tests_effectues: string;
  cause_probable: string;
  cause_confirmee: string;
  resultat_intervention: string;
  temps_passe_minutes: number | null;
  checklist_securite: string[];
}

// === INTERVENTION (création) ===
export interface InterventionCreateData {
  diagnostic: string;
}

// === INTERVENTION (mise à jour diagnostic détaillé) ===
export interface InterventionDiagnosticData {
  symptomes_constates?: string;
  tests_effectues?: string;
  cause_probable?: string;
  cause_confirmee?: string;
  resultat_intervention?: string;
  checklist_securite?: string[];
}

// === INTERVENTION IMBRIQUÉE DANS SUIVI ===
export interface InterventionSuivi {
  id: number;
  date: string;
  statut: InterventionStatut;
  diagnostic: string;
  validation_client: boolean;
  technicien: UtilisateurResume;
  pieces_utilisees: PieceUtilisee[];
  pieces_demandees: PieceDemandee[];  // ← AJOUTE
  rapport: Rapport | null;
  symptomes_constates: string;
  tests_effectues: string;
  cause_probable: string;
  cause_confirmee: string;
  resultat_intervention: string;
  temps_passe_minutes: number | null;
  checklist_securite: string[];
}

// === SUIVI COMPLET TICKET (Client) ===
export interface TicketSuivi extends TicketChampsEnrichis {
  id: number;
  date_creation: string;
  priorite: TicketPriorite;
  statut: TicketStatut;
  description: string;
  technicien: UtilisateurResume | null;
  intervention: InterventionSuivi | null;
}

// === HISTORIQUE ===
export interface HistoriqueEntry {
  id: number;
  champ_modifie: string;
  champ_modifie_display: string;
  ancienne_valeur: string;
  nouvelle_valeur: string;
  justification: string;
  auteur: UtilisateurResume | null;
  date: string;
}

// === COMMENTAIRE ===
export interface Commentaire {
  id: number;
  contenu: string;
  visibilite: VisibiliteCommentaire;
  auteur: UtilisateurResume;
  date: string;
}

export interface CommentaireCreateData {
  contenu: string;
  visibilite: VisibiliteCommentaire;
}

// === PLANIFICATION ===
export interface Planification {
  id: number;
  ticket: number;
  technicien: UtilisateurResume;
  date: string;
  heure_debut: string;
  heure_fin: string;
  duree_estimee_minutes: number;
  statut: StatutPlanification;
  date_creation: string;
}

export interface PlanificationCreateData {
  date: string;
  heure_debut: string;
  duree_estimee_minutes: number;
}

// === NOTIFICATION ===
export interface Notification {
  id: number;
  message: string;
  lien: string;
  lu: boolean;
  date: string;
}

// === RÉPONSE TerminerIntervention ===
export interface TerminerInterventionResponse {
  intervention: Intervention;
  rapport: Rapport;
}