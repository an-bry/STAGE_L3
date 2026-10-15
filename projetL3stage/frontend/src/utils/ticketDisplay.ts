import type {
  TicketStatut,
  TicketPriorite,
  TicketImpact,
  InterventionStatut,
  VisibiliteCommentaire,
  StatutPlanification,
  StatutPiece,
} from '../types/ticket';

type BadgeVariant = 'neutral' | 'primary' | 'warning' | 'danger' | 'success' | 'info';

// ============================================
// TICKET — STATUTS (9 valeurs)
// ============================================
export const STATUT_LABELS: Record<TicketStatut, string> = {
  BROUILLON: 'Brouillon',
  NOUVEAU: 'Nouveau',
  A_QUALIFIER: 'À qualifier',
  AFFECTE: 'Affecté',
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  EN_ATTENTE: 'En attente',
  RESOLU: 'Résolu',
  CLOTURE: 'Clôturé',
};

export const STATUT_VARIANTS: Record<TicketStatut, BadgeVariant> = {
  BROUILLON: 'neutral',
  NOUVEAU: 'info',
  A_QUALIFIER: 'info',
  AFFECTE: 'primary',
  PLANIFIE: 'primary',
  EN_COURS: 'warning',
  EN_ATTENTE: 'warning',
  RESOLU: 'success',
  CLOTURE: 'success',
};

// Rétrocompat (anciens composants qui utilisent STATUT_COLORS)
export const STATUT_COLORS: Record<TicketStatut, string> = {
  BROUILLON: 'bg-surface text-ink-soft border border-line',
  NOUVEAU: 'bg-info-soft text-info',
  A_QUALIFIER: 'bg-info-soft text-info',
  AFFECTE: 'bg-primary-soft text-primary',
  PLANIFIE: 'bg-primary-soft text-primary',
  EN_COURS: 'bg-warning-soft text-warning',
  EN_ATTENTE: 'bg-warning-soft text-warning',
  RESOLU: 'bg-success-soft text-success',
  CLOTURE: 'bg-success-soft text-success',
};

// ============================================
// TICKET — PRIORITÉS (4 valeurs)
// ============================================
export const PRIORITE_LABELS: Record<TicketPriorite, string> = {
  FAIBLE: 'Faible',
  MOYENNE: 'Moyenne',
  HAUTE: 'Haute',
  CRITIQUE: 'Critique',
};

export const PRIORITE_VARIANTS: Record<TicketPriorite, BadgeVariant> = {
  FAIBLE: 'neutral',
  MOYENNE: 'neutral',
  HAUTE: 'danger',
  CRITIQUE: 'danger',
};

export const PRIORITE_COLORS: Record<TicketPriorite, string> = {
  FAIBLE: 'bg-surface text-ink-soft border border-line',
  MOYENNE: 'bg-surface text-ink-soft border border-line',
  HAUTE: 'bg-danger-soft text-danger',
  CRITIQUE: 'bg-danger-soft text-danger',
};

// ============================================
// TICKET — IMPACT
// ============================================
export const IMPACT_LABELS: Record<TicketImpact, string> = {
  FAIBLE: 'Faible',
  MOYEN: 'Moyen',
  ELEVE: 'Élevé',
  CRITIQUE: 'Critique',
};

// ============================================
// INTERVENTION — STATUTS (3 valeurs)
// ============================================
export const INTERVENTION_STATUT_LABELS: Record<InterventionStatut, string> = {
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  VALIDEE: 'Validée',
};

export const INTERVENTION_STATUT_VARIANTS: Record<InterventionStatut, BadgeVariant> = {
  EN_COURS: 'warning',
  TERMINEE: 'primary',
  VALIDEE: 'success',
};

export const INTERVENTION_STATUT_COLORS: Record<InterventionStatut, string> = {
  EN_COURS: 'bg-warning-soft text-warning',
  TERMINEE: 'bg-primary-soft text-primary',
  VALIDEE: 'bg-success-soft text-success',
};

// ============================================
// COMMENTAIRE — VISIBILITÉ
// ============================================
export const VISIBILITE_LABELS: Record<VisibiliteCommentaire, string> = {
  INTERNE: 'Interne',
  PUBLIC: 'Public',
};

// ============================================
// PLANIFICATION — STATUTS
// ============================================
export const PLANIFICATION_STATUT_LABELS: Record<StatutPlanification, string> = {
  PLANIFIEE: 'Planifiée',
  ANNULEE: 'Annulée',
};

export const PLANIFICATION_STATUT_VARIANTS: Record<StatutPlanification, BadgeVariant> = {
  PLANIFIEE: 'success',
  ANNULEE: 'neutral',
};

// ============================================
// PIÈCE — STATUTS
// ============================================
export const PIECE_STATUT_LABELS: Record<StatutPiece, string> = {
  REMPLACEE: 'Remplacée',
  REPAREE: 'Réparée',
  A_COMMANDER: 'À commander',
};

export const PIECE_STATUT_VARIANTS: Record<StatutPiece, BadgeVariant> = {
  REMPLACEE: 'info',
  REPAREE: 'success',
  A_COMMANDER: 'warning',
};

// ============================================
// HELPERS
// ============================================

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatReference(id: number): string {
  const year = new Date().getFullYear();
  return `TCK-${year}-${String(id).padStart(5, '0')}`;
}

/** Formate une durée en secondes → "3h 25min" ou "45min" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

/** Formate un prix en Ariary */
export function formatAriary(value: number): string {
  return `${value.toLocaleString('fr-FR')} Ar`;
}