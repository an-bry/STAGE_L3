import api from './axiosConfig';
import type {
  Ticket, TicketAdmin, TicketTechnicien, TicketSuivi,
  TicketCreateData, TicketAffecterData,
  Intervention, InterventionCreateData, InterventionSuivi, TerminerInterventionResponse,
  PieceUtilisee, PieceUtiliseeCreateData,
} from '../types/ticket';

// ============ CLIENT ============

export const creerTicket = async (data: TicketCreateData): Promise<Ticket> => {
  const response = await api.post('/smart-ticket/tickets/', data);
  return response.data;
};

export const getMesTickets = async (): Promise<Ticket[]> => {
  const response = await api.get('/smart-ticket/tickets/mes-tickets/');
  return response.data;
};

export const getTicketSuivi = async (ticketId: number): Promise<TicketSuivi> => {
  const response = await api.get(`/smart-ticket/tickets/mes-tickets/${ticketId}/suivi/`);
  return response.data;
};

export const validerIntervention = async (interventionId: number): Promise<TicketSuivi> => {
  const response = await api.patch(`/smart-ticket/interventions/${interventionId}/valider/`);
  return response.data;
};

// ============ ADMIN ============

export interface FiltresTicketsAdmin {
  statut?: string;
  search?: string;
  ordering?: string;
}

export const getTousLesTickets = async (filtres?: FiltresTicketsAdmin): Promise<TicketAdmin[]> => {
  const response = await api.get('/smart-ticket/tickets/admin/', { params: filtres });
  return response.data;
};

export const getTicketDetailAdmin = async (ticketId: number): Promise<TicketAdmin> => {
  const response = await api.get(`/smart-ticket/tickets/admin/${ticketId}/`);
  return response.data;
};

export const affecterTechnicien = async (ticketId: number, data: TicketAffecterData): Promise<TicketAdmin> => {
  const response = await api.patch(`/smart-ticket/tickets/admin/${ticketId}/affecter/`, data);
  return response.data;
};

// ============ TECHNICIEN ============

export const getMesAffectations = async (): Promise<TicketTechnicien[]> => {
  const response = await api.get('/smart-ticket/tickets/technicien/mes-affectations/');
  return response.data;
};

export const creerIntervention = async (ticketId: number, data: InterventionCreateData): Promise<Intervention> => {
  const response = await api.post(`/smart-ticket/tickets/${ticketId}/intervention/`, data);
  return response.data;
};

export const getInterventionDuTicket = async (ticketId: number): Promise<InterventionSuivi | null> => {
  const response = await api.get(`/smart-ticket/tickets/${ticketId}/intervention/`);
  return response.data;
};

export const getPiecesUtilisees = async (interventionId: number): Promise<PieceUtilisee[]> => {
  const response = await api.get(`/smart-ticket/interventions/${interventionId}/pieces/`);
  return response.data;
};

export const ajouterPieceUtilisee = async (interventionId: number, data: PieceUtiliseeCreateData): Promise<PieceUtilisee> => {
  const response = await api.post(`/smart-ticket/interventions/${interventionId}/pieces/`, data);
  return response.data;
};

export const terminerIntervention = async (interventionId: number): Promise<TerminerInterventionResponse> => {
  const response = await api.patch(`/smart-ticket/interventions/${interventionId}/terminer/`);
  return response.data;
};
// ============ HISTORIQUE ============

export interface HistoriqueEntry {
  id: number;
  champ_modifie: string;
  champ_modifie_display: string;
  ancienne_valeur: string;
  nouvelle_valeur: string;
  justification: string;
  auteur: { id: number; username: string; first_name: string; last_name: string } | null;
  date: string;
}

export const getHistoriqueTicket = async (ticketId: number): Promise<HistoriqueEntry[]> => {
  const response = await api.get(`/smart-ticket/tickets/${ticketId}/historique/`);
  return response.data;
};

// ============ COMMENTAIRES ============

export interface Commentaire {
  date_creation(date_creation: any): import("react").ReactNode;
  id: number;
  contenu: string;
  visibilite: 'INTERNE' | 'PUBLIC';
  auteur: { id: number; username: string; first_name: string; last_name: string };
  date: string;
}

export interface CommentaireCreateData {
  contenu: string;
  visibilite: 'INTERNE' | 'PUBLIC';
}

export const getCommentaires = async (ticketId: number): Promise<Commentaire[]> => {
  const response = await api.get(`/smart-ticket/tickets/${ticketId}/commentaires/`);
  return response.data;
};

export const ajouterCommentaire = async (
  ticketId: number,
  data: CommentaireCreateData
): Promise<Commentaire> => {
  const response = await api.post(`/smart-ticket/tickets/${ticketId}/commentaires/`, data);
  return response.data;
};

// ============ PRIORITÉ MANUELLE ============

export const changerPrioriteManuelle = async (
  ticketId: number,
  data: { priorite: string; justification: string }
): Promise<TicketAdmin> => {
  const response = await api.patch(`/smart-ticket/tickets/admin/${ticketId}/priorite/`, data);
  return response.data;
};

// ============ PLANIFICATION ============

export interface Planification {
  id: number;
  ticket: number;
  technicien: { id: number; username: string; first_name: string; last_name: string };
  date: string;
  heure_debut: string;
  heure_fin: string;
  duree_estimee_minutes: number;
  statut: 'PLANIFIEE' | 'ANNULEE';
  date_creation: string;
}

export interface PlanificationCreateData {
  date: string;
  heure_debut: string;
  duree_estimee_minutes: number;
}

export const planifierIntervention = async (
  ticketId: number,
  data: PlanificationCreateData
): Promise<Planification> => {
  const response = await api.post(`/smart-ticket/tickets/${ticketId}/planifier/`, data);
  return response.data;
};

export const getPlanificationActive = async (ticketId: number): Promise<Planification | null> => {
  try {
    const response = await api.get(`/smart-ticket/tickets/${ticketId}/planification/`);
    return response.data;
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
};

export const annulerPlanification = async (planificationId: number): Promise<Planification> => {
  const response = await api.patch(`/smart-ticket/planifications/${planificationId}/annuler/`);
  return response.data;
};

// ============ PDF RAPPORT ============

export const getRapportPDFUrl = (interventionId: number): string => {
  const baseURL = api.defaults.baseURL || '';
  return `${baseURL}/smart-ticket/interventions/${interventionId}/rapport/pdf/`;
};

export const telechargerRapportPDF = async (interventionId: number, inclurePrix = true) => {
  const response = await api.get(
    `/smart-ticket/interventions/${interventionId}/rapport/pdf/`,
    {
      params: { inclure_prix: inclurePrix },
      responseType: 'blob',
    }
  );

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rapport_intervention_${interventionId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
// ============ CATALOGUE PIÈCES ============

export interface PieceCatalogue {
  id: number;
  reference: string;
  designation: string;
  stock_actuel: number;
  lieu_stockage: string;
  prix_unitaire: number;
}

export const getCataloguePieces = async (search?: string): Promise<PieceCatalogue[]> => {
  const response = await api.get('/smart-ticket/pieces/', {
    params: search ? { search } : undefined,
  });
  return response.data;
};

// ============ DIAGNOSTIC ENRICHI ============

export interface InterventionDiagnosticData {
  symptomes_constates?: string;
  tests_effectues?: string;
  cause_probable?: string;
  cause_confirmee?: string;
  resultat_intervention?: string;
  checklist_securite?: string[];
}

export const mettreAJourDiagnostic = async (
  interventionId: number,
  data: InterventionDiagnosticData
): Promise<Intervention> => {
  const response = await api.patch(
    `/smart-ticket/interventions/${interventionId}/diagnostic-detail/`,
    data
  );
  return response.data;
};

// ============ TERMINER INTERVENTION ============

export const terminerInterventionAvecTemps = async (
  interventionId: number,
  tempsPasseMinutes?: number
): Promise<TerminerInterventionResponse> => {
  const response = await api.patch(
    `/smart-ticket/interventions/${interventionId}/terminer/`,
    tempsPasseMinutes ? { temps_passe_minutes: tempsPasseMinutes } : {}
  );
  return response.data;
};
// ============ CHARGE TECHNICIENS ============

export interface TechnicienCharge {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  specialite: string;
  charge_actuelle: number;
  charge_max: number;
  charge_avertissement: number;
}

export const getTechniciensAvecCharge = async (): Promise<TechnicienCharge[]> => {
  const response = await api.get('/smart-ticket/tickets/admin/techniciens-charge/');
  return response.data;
};
// ============================================
// SMART TICKET — Lot 10 : Diagnostic, Devis, Pièces demandées
// ============================================

// ============ PIÈCES DEMANDÉES (Technicien, avant devis) ============

export interface PieceDemandee {
  id: number;
  piece: number | null;
  nom: string;
  reference: string;
  quantite: number;
}

export interface PieceDemandeeCreateData {
  piece?: number | null;
  nom?: string;
  reference?: string;
  quantite: number;
}

export const getPiecesDemandees = async (
  interventionId: number
): Promise<PieceDemandee[]> => {
  const response = await api.get(
    `/smart-ticket/interventions/${interventionId}/pieces-demandees/`
  );
  return response.data;
};

export const ajouterPieceDemandee = async (
  interventionId: number,
  data: PieceDemandeeCreateData
): Promise<PieceDemandee> => {
  const response = await api.post(
    `/smart-ticket/interventions/${interventionId}/pieces-demandees/`,
    data
  );
  return response.data;
};

export const supprimerPieceDemandee = async (pieceId: number): Promise<void> => {
  await api.delete(`/smart-ticket/pieces-demandees/${pieceId}/`);
};

// ============ SOUMETTRE DIAGNOSTIC (Technicien) ============

export const soumettreDiagnostic = async (interventionId: number) => {
  const response = await api.patch(
    `/smart-ticket/interventions/${interventionId}/soumettre-diagnostic/`
  );
  return response.data;
};

// ============ DEVIS (Admin + Client) ============

export interface LigneDevis {
  id: number;
  piece: number | null;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  sous_total: number;
}

export interface LigneDevisInput {
  piece?: number | null;
  designation?: string;
  quantite: number;
  prix_unitaire?: number;
}

export interface Devis {
  id: number;
  ticket: number;
  revision: number;
  statut: 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE';
  lignes: LigneDevis[];
  montant_pieces: number;
  montant_main_oeuvre: number;
  remise: number;
  montant_total: number;
  commentaire: string;
  motif_refus: string;
  cree_par: { id: number; username: string; first_name: string; last_name: string } | null;
  date_creation: string;
  date_envoi: string | null;
  date_reponse: string | null;
}

export interface DevisCreateData {
  montant_main_oeuvre?: number;
  remise?: number;
  commentaire?: string;
  lignes?: LigneDevisInput[];
}

export const getDevisTicket = async (ticketId: number): Promise<Devis[]> => {
  const response = await api.get(`/smart-ticket/tickets/${ticketId}/devis/`);
  return response.data;
};

export const creerDevis = async (
  ticketId: number,
  data: DevisCreateData
): Promise<Devis> => {
  const response = await api.post(
    `/smart-ticket/tickets/admin/${ticketId}/devis/`,
    data
  );
  return response.data;
};

export const modifierDevis = async (
  devisId: number,
  data: DevisCreateData
): Promise<Devis> => {
  const response = await api.patch(`/smart-ticket/devis/${devisId}/`, data);
  return response.data;
};

export const envoyerDevis = async (devisId: number): Promise<Devis> => {
  const response = await api.patch(`/smart-ticket/devis/${devisId}/envoyer/`);
  return response.data;
};

export const accepterDevis = async (devisId: number): Promise<{
  devis: Devis;
  ticket: any;
}> => {
  const response = await api.patch(`/smart-ticket/devis/${devisId}/accepter/`);
  return response.data;
};

export const refuserDevis = async (
  devisId: number,
  motif: string
): Promise<Devis> => {
  const response = await api.patch(`/smart-ticket/devis/${devisId}/refuser/`, {
    motif,
  });
  return response.data;
};