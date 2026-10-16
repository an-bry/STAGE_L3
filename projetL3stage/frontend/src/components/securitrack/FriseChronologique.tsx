import {
  HardDrive, FileText, Wrench, Ticket, Hammer,
  type LucideIcon,
} from 'lucide-react';
import type { EvenementHistorique, TypeEvenement } from '../../types/securitrack';
import { EtatContratBadge, StatutMaintenanceBadge } from './badges';

// ── Config par type d'événement ──
const TYPE_CONFIG: Record<TypeEvenement, {
  label: string;
  icon: LucideIcon;
  bg: string;
  color: string;
}> = {
  INSTALLATION: {
    label: 'Installation',
    icon: HardDrive,
    bg: 'bg-info-soft',
    color: 'text-info',
  },
  CONTRAT: {
    label: 'Contrat',
    icon: FileText,
    bg: 'bg-primary-soft',
    color: 'text-primary',
  },
  MAINTENANCE_PREVENTIVE: {
    label: 'Maintenance',
    icon: Wrench,
    bg: 'bg-warning-soft',
    color: 'text-warning',
  },
  TICKET: {
    label: 'Ticket',
    icon: Ticket,
    bg: 'bg-danger-soft',
    color: 'text-danger',
  },
  INTERVENTION: {
    label: 'Intervention',
    icon: Hammer,
    bg: 'bg-success-soft',
    color: 'text-success',
  },
};

// ── Badge de statut adaptatif selon le type ──
function StatutBadge({ type, statut }: { type: TypeEvenement; statut: string }) {
  if (type === 'CONTRAT') return <EtatContratBadge etat={statut as any} />;
  if (type === 'MAINTENANCE_PREVENTIVE') return <StatutMaintenanceBadge statut={statut as any} />;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface text-ink-soft">
      {statut}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function FriseChronologique({
  evenements,
  onEvenementClick,
}: {
  evenements: EvenementHistorique[];
  onEvenementClick?: (ev: EvenementHistorique) => void;
}) {
  if (evenements.length === 0) {
    return (
      <p className="text-sm text-ink-faint italic py-4">
        Aucun événement enregistré pour cet équipement.
      </p>
    );
  }

  return (
    <div className="relative">
      {/* Ligne verticale */}
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-line" aria-hidden />

      <ul className="space-y-4">
        {evenements.map((ev, idx) => {
          const cfg = TYPE_CONFIG[ev.type];
          const Icon = cfg.icon;
          return (
            <li key={`${ev.type}-${ev.id ?? idx}-${ev.date}`} className="relative pl-14">
              {/* Icône ronde */}
              <div className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center ${cfg.bg} ${cfg.color} border-2 border-card shadow-xs`}>
                <Icon size={16} />
              </div>

              {/* Contenu */}
              <div
                className={`bg-card border border-line rounded-lg p-3 transition-colors ${
                  onEvenementClick ? 'hover:border-primary/40 cursor-pointer' : ''
                }`}
                onClick={() => onEvenementClick?.(ev)}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-ink leading-snug">
                    {ev.libelle}
                  </p>
                  <StatutBadge type={ev.type} statut={ev.statut} />
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
                  <span>{formatDate(ev.date)}</span>
                  {ev.technicien && (
                    <>
                      <span className="text-ink-faint">•</span>
                      <span>{ev.technicien}</span>
                    </>
                  )}
                  {ev.ticket && (
                    <>
                      <span className="text-ink-faint">•</span>
                      <span>Ticket #{ev.ticket}</span>
                    </>
                  )}
                </div>

                {ev.detail && (
                  <p className="text-xs text-ink-soft mt-2 whitespace-pre-wrap line-clamp-3">
                    {ev.detail}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}