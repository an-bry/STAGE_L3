import Badge from './Badge';
import type { TicketStatut, InterventionStatut } from '../../types/ticket';
import {
  STATUT_LABELS, STATUT_VARIANTS,
  INTERVENTION_STATUT_LABELS, INTERVENTION_STATUT_VARIANTS,
} from '../../utils/ticketDisplay';

export function StatusBadge({ statut }: { statut: TicketStatut }) {
  return <Badge variant={STATUT_VARIANTS[statut]} dot>{STATUT_LABELS[statut]}</Badge>;
}

export function InterventionStatusBadge({ statut }: { statut: InterventionStatut }) {
  return <Badge variant={INTERVENTION_STATUT_VARIANTS[statut]} dot>{INTERVENTION_STATUT_LABELS[statut]}</Badge>;
}