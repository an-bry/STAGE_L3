import type { EtatContrat, StatutEquipement, StatutMaintenance } from '../../types/securitrack';

// ── Badge générique (variantes alignées sur ton thème) ──
function SecuritrackBadge({
  tone, children, dot = false,
}: {
  tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
  dot?: boolean;
}) {
  const classes = {
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    info: 'bg-info-soft text-info',
    neutral: 'bg-surface text-ink-soft',
  }[tone];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap ${classes}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

// ── Contrat ──
export function EtatContratBadge({ etat }: { etat: EtatContrat }) {
  const config: Record<EtatContrat, { label: string; tone: any }> = {
    ACTIF: { label: 'Actif', tone: 'success' },
    BIENTOT_EXPIRE: { label: 'Bientôt expiré', tone: 'warning' },
    EXPIRE: { label: 'Expiré', tone: 'danger' },
  };
  const { label, tone } = config[etat];
  return <SecuritrackBadge tone={tone} dot>{label}</SecuritrackBadge>;
}

// ── Maintenance ──
export function StatutMaintenanceBadge({ statut }: { statut: StatutMaintenance }) {
  const config: Record<StatutMaintenance, { label: string; tone: any }> = {
    PLANIFIEE: { label: 'Planifiée', tone: 'info' },
    EN_COURS: { label: 'En cours', tone: 'warning' },
    TERMINEE: { label: 'Terminée', tone: 'success' },
  };
  const { label, tone } = config[statut];
  return <SecuritrackBadge tone={tone} dot>{label}</SecuritrackBadge>;
}

// ── Équipement ──
export function StatutEquipementBadge({ statut }: { statut: StatutEquipement }) {
  const config: Record<StatutEquipement, { label: string; tone: any }> = {
    ACTIF: { label: 'Actif', tone: 'success' },
    EN_PANNE: { label: 'En panne', tone: 'danger' },
    HORS_SERVICE: { label: 'Hors service', tone: 'neutral' },
  };
  const { label, tone } = config[statut];
  return <SecuritrackBadge tone={tone} dot>{label}</SecuritrackBadge>;
}

// ── Garantie (calcule selon jours restants) ──
export function GarantieBadge({ jours, expiree }: { jours: number; expiree: boolean }) {
  if (expiree) return <SecuritrackBadge tone="danger">Garantie expirée</SecuritrackBadge>;
  if (jours <= 30) return <SecuritrackBadge tone="warning">{jours} j restants</SecuritrackBadge>;
  return <SecuritrackBadge tone="success">{jours} j</SecuritrackBadge>;
}