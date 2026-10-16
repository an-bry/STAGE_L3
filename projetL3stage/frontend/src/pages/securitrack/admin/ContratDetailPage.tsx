import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, User, HardDrive, Pencil,
  AlertTriangle, Phone,  Shield, 
} from 'lucide-react';
import { contratsApi } from '../../../api/securitrack';
import type { Contrat } from '../../../types/securitrack';
import AppShell from '../../../components/layout/AppShell';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import { EtatContratBadge, StatutEquipementBadge, GarantieBadge } from '../../../components/securitrack/badges';
import ContratFormModal from '../../../components/securitrack/ContratFormModal';
import { useToast } from '../../../context/ToastContext';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR');
}

function joursRestants(dateFin: string) {
  const diff = new Date(dateFin).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function ContratDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [contrat, setContrat] = useState<Contrat | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const charger = () => {
    if (!id) return;
    setLoading(true);
    contratsApi.get(Number(id))
      .then(setContrat)
      .catch(() => toast.error('Erreur', 'Impossible de charger le contrat.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <AppShell title="Contrat" breadcrumb={['NjCam', 'SecuriTrack', 'Contrats']}>
        <div className="p-6 text-ink-soft">Chargement…</div>
      </AppShell>
    );
  }

  if (!contrat) {
    return (
      <AppShell title="Contrat" breadcrumb={['NjCam', 'SecuriTrack', 'Contrats']}>
        <div className="p-6 max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/securitrack/admin/contrats')}
            className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink mb-4"
          >
            <ArrowLeft size={16} /> Contrats
          </button>
          <EmptyState
            icon={<AlertTriangle size={32} />}
            title="Contrat introuvable"
            action={<Button onClick={() => navigate('/securitrack/admin/contrats')}>Retour</Button>}
          />
        </div>
      </AppShell>
    );
  }

  const jours = joursRestants(contrat.date_fin);
  const duree = Math.ceil(
    (new Date(contrat.date_fin).getTime() - new Date(contrat.date_debut).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <AppShell
      title={`CTR-${String(contrat.id).padStart(5, '0')}`}
      breadcrumb={['NjCam', 'SecuriTrack', 'Contrats', `CTR-${contrat.id}`]}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-5">

        {/* Retour */}
        <button
          onClick={() => navigate('/securitrack/admin/contrats')}
          className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={16} /> Contrats
        </button>

        {/* En-tête */}
        <div className="bg-card border border-line rounded-lg p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <EtatContratBadge etat={contrat.etat} />
                <span className="text-xs text-ink-soft">
                  {duree} jours de couverture
                </span>
              </div>
              <h1 className="text-xl font-semibold text-ink mb-1">
                Contrat {contrat.client_nom}
              </h1>
              <p className="text-sm text-ink-soft">
                Du {formatDate(contrat.date_debut)} au {formatDate(contrat.date_fin)}
              </p>
            </div>

            <Button
              variant="secondary"
              icon={<Pencil size={15} />}
              onClick={() => setModalOpen(true)}
            >
              Modifier
            </Button>
          </div>

          {/* Alerte expiration */}
          {contrat.etat === 'BIENTOT_EXPIRE' && (
            <div className="bg-warning-soft border border-warning/30 rounded-md p-3 mb-4 flex items-start gap-2 text-xs text-warning">
              <Phone size={14} className="shrink-0 mt-0.5" />
              <span>
                Ce contrat expire dans <strong>{jours} jours</strong>.
                Pensez à le renouveler pour éviter toute interruption de couverture.
              </span>
            </div>
          )}
          {contrat.etat === 'EXPIRE' && (
            <div className="bg-danger-soft border border-danger/30 rounded-md p-3 mb-4 flex items-start gap-2 text-xs text-danger">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                Ce contrat a expiré il y a <strong>{Math.abs(jours)} jours</strong>.
                Les équipements ne sont plus couverts.
              </span>
            </div>
          )}

          {/* Méta principale */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-line">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-md bg-info-soft text-info shrink-0">
                <User size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-ink-soft">Client</p>
                <p className="text-sm font-medium text-ink truncate">{contrat.client_nom}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-md bg-primary-soft text-primary shrink-0">
                <Calendar size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-ink-soft">Date de début</p>
                <p className="text-sm font-medium text-ink">{formatDate(contrat.date_debut)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-md bg-warning-soft text-warning shrink-0">
                <Calendar size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-ink-soft">Date de fin</p>
                <p className="text-sm font-medium text-ink">{formatDate(contrat.date_fin)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section équipements couverts */}
        <div className="bg-card border border-line rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
              <HardDrive size={16} />
              Équipements couverts ({contrat.equipements_detail.length})
            </h3>
          </div>

          {contrat.equipements_detail.length === 0 ? (
            <div className="bg-surface rounded-md p-6 text-center text-sm text-ink-faint">
              Aucun équipement n'est rattaché à ce contrat.
            </div>
          ) : (
            <div className="space-y-2">
              {contrat.equipements_detail.map((eq) => (
                <div
                  key={eq.id}
                  className="bg-surface border border-line rounded-md p-3 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors cursor-pointer"
                  onClick={() => navigate(`/securitrack/admin/equipements/${eq.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-[11px] font-medium text-ink-soft">
                        EQ-{String(eq.id).padStart(5, '0')}
                      </span>
                      <span className="text-[11px] text-ink-faint">•</span>
                      <span className="text-[11px] text-ink-soft">{eq.type_equipement}</span>
                      {eq.adresse_ip && (
                        <>
                          <span className="text-[11px] text-ink-faint">•</span>
                          <span className="text-[11px] font-mono text-ink-soft">{eq.adresse_ip}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm font-medium text-ink truncate">{eq.model}</p>
                    <p className="text-xs text-ink-soft mt-0.5">
                      Garantie jusqu'au {formatDate(eq.date_fin_garantie)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatutEquipementBadge statut={eq.statut} />
                    <GarantieBadge jours={0} expiree={new Date(eq.date_fin_garantie) < new Date()} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aide contextuelle */}
        <div className="bg-info-soft border border-info/20 rounded-lg p-4 flex items-start gap-3">
          <Shield size={18} className="text-info shrink-0 mt-0.5" />
          <div className="text-xs text-info">
            <p className="font-medium mb-1">À propos de ce contrat</p>
            <ul className="space-y-0.5 opacity-90">
              <li>• Les équipements listés ci-dessus sont automatiquement couverts par la garantie contractuelle.</li>
              <li>• Les maintenances préventives ne peuvent être planifiées que sur un équipement couvert à la date choisie.</li>
              <li>• Un contrat ne peut pas être supprimé, il reste consultable même expiré.</li>
            </ul>
          </div>
        </div>

      </div>

      {/* Modale modification */}
      <ContratFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={charger}
        contrat={contrat}
      />
    </AppShell>
  );
}