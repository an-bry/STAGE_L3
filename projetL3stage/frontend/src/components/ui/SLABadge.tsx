import { Clock, AlertTriangle } from 'lucide-react';

interface SLABadgeProps {
  slaRestant: number | null; // en secondes
  slaDepasse: boolean;
  slaDeadline?: string | null;
}

export default function SLABadge({ slaRestant, slaDepasse, slaDeadline }: SLABadgeProps) {
  if (slaRestant === null && !slaDeadline) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-surface text-ink-faint border border-line">
        <Clock size={11} /> SLA non défini
      </span>
    );
  }

  if (slaDepasse) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-danger-soft text-danger">
        <AlertTriangle size={11} /> SLA dépassé
      </span>
    );
  }

  if (slaRestant === null) return null;

  const heures = Math.floor(slaRestant / 3600);
  const minutes = Math.floor((slaRestant % 3600) / 60);

  const urgent = slaRestant < 3600; // < 1h
  const proche = slaRestant < 6 * 3600; // < 6h

  const variant = urgent
    ? 'bg-danger-soft text-danger'
    : proche
    ? 'bg-warning-soft text-warning'
    : 'bg-success-soft text-success';

  const label =
    heures > 0
      ? `${heures}h ${minutes}min restant`
      : `${minutes}min restant`;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${variant}`}>
      <Clock size={11} /> {label}
    </span>
  );
}