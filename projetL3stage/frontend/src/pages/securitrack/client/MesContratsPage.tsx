import { useEffect, useMemo, useState } from 'react';

import {
  FileText, Calendar, HardDrive, Phone, CheckCircle2, Clock, XCircle,
} from 'lucide-react';
import { contratsApi } from '../../../api/securitrack';
import type { Contrat } from '../../../types/securitrack';
import AppShell from '../../../components/layout/AppShell';
import EmptyState from '../../../components/ui/EmptyState';
import { EtatContratBadge } from '../../../components/securitrack/badges';
import { useToast } from '../../../context/ToastContext';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR');
}

function joursRestants(dateFin: string) {
  const diff = new Date(dateFin).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function MesContratsPage() {
  const toast = useToast();
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contratsApi.mesContrats()
      .then(setContrats)
      .catch(() => toast.error('Erreur', 'Impossible de charger vos contrats.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => ({
    total: contrats.length,
    actifs: contrats.filter(c => c.etat === 'ACTIF').length,
    bientot: contrats.filter(c => c.etat === 'BIENTOT_EXPIRE').length,
    expires: contrats.filter(c => c.etat === 'EXPIRE').length,
  }), [contrats]);

  const tries = useMemo(() => {
    const ordre: Record<string, number> = { BIENTOT_EXPIRE: 0, ACTIF: 1, EXPIRE: 2 };
    return [...contrats].sort((a, b) => {
      const d = ordre[a.etat] - ordre[b.etat];
      return d !== 0 ? d : new Date(a.date_fin).getTime() - new Date(b.date_fin).getTime();
    });
  }, [contrats]);

  return (
    <AppShell
      title="Mes contrats"
      breadcrumb={['NjCam', 'SecuriTrack', 'Mes contrats']}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary-soft text-primary"><FileText size={18} /></div>
            <div>
              <p className="text-xs text-ink-soft">Total</p>
              <p className="text-xl font-semibold text-ink">{stats.total}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-success-soft text-success"><CheckCircle2 size={18} /></div>
            <div>
              <p className="text-xs text-ink-soft">Actifs</p>
              <p className="text-xl font-semibold text-ink">{stats.actifs}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-warning-soft text-warning"><Clock size={18} /></div>
            <div>
              <p className="text-xs text-ink-soft">Bientôt expirés</p>
              <p className="text-xl font-semibold text-ink">{stats.bientot}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-danger-soft text-danger"><XCircle size={18} /></div>
            <div>
              <p className="text-xs text-ink-soft">Expirés</p>
              <p className="text-xl font-semibold text-ink">{stats.expires}</p>
            </div>
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="bg-card border border-line rounded-lg p-12 text-center text-sm text-ink-soft">
            Chargement de vos contrats…
          </div>
        ) : contrats.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<FileText size={24} />}
              title="Aucun contrat"
              description="Vous n'avez encore aucun contrat. Contactez-nous pour en établir un."
            />
          </div>
        ) : (
          <div className="space-y-3">
            {tries.map((c) => {
              const jours = joursRestants(c.date_fin);
              return (
                <div key={c.id} className="bg-card border border-line rounded-lg p-5">

                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="font-mono text-xs text-ink-soft mb-1">
                        CTR-{String(c.id).padStart(5, '0')}
                      </p>
                      <p className="text-sm font-medium text-ink flex items-center gap-1.5">
                        <Calendar size={13} className="text-primary" />
                        Du {formatDate(c.date_debut)} au {formatDate(c.date_fin)}
                      </p>
                    </div>
                    <EtatContratBadge etat={c.etat} />
                  </div>

                  {/* Alerte renouvellement */}
                  {c.etat === 'BIENTOT_EXPIRE' && (
                    <div className="bg-warning-soft border border-warning/30 rounded-md p-3 mb-4 flex items-start gap-2 text-xs text-warning">
                      <Phone size={14} className="shrink-0 mt-0.5" />
                      <span>
                        Votre contrat expire dans <strong>{jours} jours</strong>.
                        Contactez-nous pour le renouveler et éviter toute interruption de service.
                      </span>
                    </div>
                  )}
                  {c.etat === 'EXPIRE' && (
                    <div className="bg-danger-soft border border-danger/30 rounded-md p-3 mb-4 flex items-start gap-2 text-xs text-danger">
                      <Phone size={14} className="shrink-0 mt-0.5" />
                      <span>
                        Ce contrat a expiré il y a <strong>{Math.abs(jours)} jours</strong>.
                        Contactez-nous pour le renouveler.
                      </span>
                    </div>
                  )}

                  {/* Équipements */}
                  <div>
                    <p className="text-xs font-medium text-ink-soft mb-2 flex items-center gap-1.5">
                      <HardDrive size={12} />
                      {c.equipements_detail.length} équipement{c.equipements_detail.length > 1 ? 's' : ''} couvert{c.equipements_detail.length > 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {c.equipements_detail.map((e) => (
                        <div key={e.id} className="bg-surface border border-line rounded-md px-2.5 py-1.5 text-xs">
                          <p className="font-medium text-ink">{e.model}</p>
                          <p className="text-[10px] text-ink-faint">{e.type_equipement}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}