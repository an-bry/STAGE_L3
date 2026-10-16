import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, HardDrive, MapPin, Shield, Wrench, Ticket,
  AlertTriangle, AlertOctagon, Info, ExternalLink,
} from 'lucide-react';
import { equipementsApi } from '../../../api/securitrack';
import type { HistoriqueEquipement, EvenementHistorique } from '../../../types/securitrack';
import AppShell from '../../../components/layout/AppShell';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import { StatutEquipementBadge, GarantieBadge } from '../../../components/securitrack/badges';
import FriseChronologique from '../../../components/securitrack/FriseChronologique';
import { useToast } from '../../../context/ToastContext';

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

export default function MesEquipementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData] = useState<HistoriqueEquipement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    equipementsApi.historique(Number(id))
      .then(setData)
      .catch(() => toast.error('Erreur', "Impossible de charger l'équipement."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleEvenementClick = (ev: EvenementHistorique) => {
    if (ev.type === 'TICKET' && ev.id) {
      navigate(`/smart-ticket/client/tickets/${ev.id}`);
    } else if (ev.type === 'INTERVENTION' && ev.ticket) {
      navigate(`/smart-ticket/client/tickets/${ev.ticket}`);
    }
  };

  if (loading) {
    return (
      <AppShell title="Équipement" breadcrumb={['NjCam', 'SecuriTrack', 'Mes équipements']}>
        <div className="p-6 text-ink-soft">Chargement…</div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell title="Équipement" breadcrumb={['NjCam', 'SecuriTrack', 'Mes équipements']}>
        <div className="p-6 max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/securitrack/client/equipements')}
            className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink mb-4"
          >
            <ArrowLeft size={16} /> Mes équipements
          </button>
          <EmptyState
            icon={<AlertTriangle size={32} />}
            title="Équipement introuvable"
            action={<Button onClick={() => navigate('/securitrack/client/equipements')}>Retour</Button>}
          />
        </div>
      </AppShell>
    );
  }

  const { equipement: eq, resume, chronologie } = data;

  return (
    <AppShell
      title={`EQ-${String(eq.id).padStart(5, '0')}`}
      breadcrumb={['NjCam', 'SecuriTrack', 'Mes équipements', `EQ-${eq.id}`]}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-5">

        <button
          onClick={() => navigate('/securitrack/client/equipements')}
          className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={16} /> Mes équipements
        </button>

        {/* En-tête */}
        <div className="bg-card border border-line rounded-lg p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <StatutEquipementBadge statut={eq.statut} />
                <GarantieBadge jours={eq.garantie_jours_restants} expiree={eq.garantie_expiree} />
              </div>
              <h1 className="text-xl font-semibold text-ink mb-1">{eq.model}</h1>
              <p className="text-sm text-ink-soft">
                {eq.type_equipement}
                {eq.adresse_ip && <> • <span className="font-mono">{eq.adresse_ip}</span></>}
              </p>
            </div>

            {/* Bouton signaler problème */}
            <Button
              variant="danger"
              icon={<AlertOctagon size={15} />}
              onClick={() => navigate(`/smart-ticket/client/tickets?equipement=${eq.id}`)}
            >
              Signaler un problème
            </Button>
          </div>

          {/* Méta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-line">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-md bg-info-soft text-info shrink-0">
                <MapPin size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-ink-soft">Site</p>
                <p className="text-sm font-medium text-ink truncate">{eq.site_nom}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-md bg-success-soft text-success shrink-0">
                <Shield size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-ink-soft">Garantie</p>
                <p className="text-sm font-medium text-ink truncate">
                  jusqu'au {formatDate(eq.date_fin_garantie)}
                </p>
              </div>
            </div>
          </div>

          {/* Encart provenance */}
          <div className="bg-info-soft border border-info/20 rounded-md p-3 mt-4 flex items-start gap-2 text-xs text-info">
            <Info size={14} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>Cet équipement provient de </span>
              <button
                onClick={() => navigate(`/camtrack/client/demandes/${eq.demande}`)}
                className="font-medium underline hover:no-underline"
              >
                votre demande DEM-{String(eq.demande).padStart(5, '0')}
              </button>
              <span>.</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-line">
            <Button
              variant="secondary"
              icon={<ExternalLink size={15} />}
              onClick={() => navigate(`/camtrack/client/demandes/${eq.demande}`)}
            >
              Voir la demande d'origine
            </Button>
          </div>
        </div>

        {/* Résumé */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-line rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1 text-ink-soft">
              <Wrench size={14} />
              <p className="text-xs">Maintenances</p>
            </div>
            <p className="text-xl font-semibold text-ink">{resume.nb_maintenances}</p>
            <p className="text-[11px] text-ink-faint mt-1">
              {resume.nb_terminees} terminée{resume.nb_terminees > 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-card border border-line rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1 text-ink-soft">
              <Ticket size={14} />
              <p className="text-xs">Tickets</p>
            </div>
            <p className="text-xl font-semibold text-ink">{resume.nb_tickets}</p>
            <p className="text-[11px] text-ink-faint mt-1">
              {resume.nb_tickets_ouverts} ouvert{resume.nb_tickets_ouverts > 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-card border border-line rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1 text-ink-soft">
              <Wrench size={14} />
              <p className="text-xs">Dernière maintenance</p>
            </div>
            <p className="text-sm font-medium text-ink">
              {formatDate(resume.derniere_maintenance)}
            </p>
          </div>
          <div className="bg-card border border-line rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1 text-ink-soft">
              <Wrench size={14} />
              <p className="text-xs">Prochaine maintenance</p>
            </div>
            <p className="text-sm font-medium text-ink">
              {formatDate(resume.prochaine_maintenance)}
            </p>
          </div>
        </div>

        {/* Frise */}
        <div className="bg-card border border-line rounded-lg p-6">
          <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
            <HardDrive size={16} /> Historique ({chronologie.length})
          </h3>
          <FriseChronologique
            evenements={chronologie}
            onEvenementClick={handleEvenementClick}
          />
        </div>
      </div>
    </AppShell>
  );
}