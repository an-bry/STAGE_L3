import { AlertTriangle } from 'lucide-react';
import Badge from './Badge';
import type { TicketPriorite } from '../../types/ticket';
import { PRIORITE_LABELS, PRIORITE_VARIANTS } from '../../utils/ticketDisplay';

export default function PriorityBadge({ priorite }: { priorite: TicketPriorite }) {
  return (
    <Badge variant={PRIORITE_VARIANTS[priorite]}>
      {priorite === 'HAUTE' && <AlertTriangle size={11} />}
      {PRIORITE_LABELS[priorite]}
    </Badge>
  );
}