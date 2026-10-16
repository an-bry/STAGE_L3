import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, User, Wrench, HardDrive, FileText,
  AlertTriangle, ExternalLink, Building2,
} from 'lucide-react';
import { sitesApi } from '../../../api/securitrack';
import type { Site } from '../../../types/securitrack';
import AppShell from '../../../components/layout/AppShell';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import CarteLeaflet from '../../../components/securitrack/CarteLeaflet';
import { useToast } from '../../../context/ToastContext';

const STATUT_BADGE: Record<string, { label: string; tone: string }> = {
  EN_ETUDE: { label: 'En étude', tone: 'bg-warning-soft text-warning' },
  VALIDE: { label: 'Validé', tone: 'bg-success-soft text-success' },
  REJETE: { label: 'Rejeté', tone: 'bg-danger-soft text-danger' },
};

function StatutSiteBadge({ statut }: { statut: string }) {
  const key = String(statut || '').toUpperCase();
  const cfg = STATUT_BADGE[key] ?? { label: statut, tone: 'bg-surface text-ink-soft' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${cfg.tone}`}>
      {cfg.label}
    </span>
  );
}

export default function SiteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    sitesApi.get(Number(id))
      .then(setSite)
      .catch(() => toast.error('Erreur', 'Impossible de charger le site.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <AppShell title="Site" breadcrumb={['NjCam', 'SecuriTrack', 'Sites']}>
        <div className="p-6 text-ink-soft">Chargement…</div>
      </AppShell>
    );
  }

  if (!site) {
    return (
      <AppShell title="Site" breadcrumb={['NjCam', 'SecuriTrack', 'Sites']}>
        <div className="p-6 max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/securitrack/admin/sites')}
            className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink mb-4"
          >
            <ArrowLeft size={16} /> Sites
          </button>
          <EmptyState
            icon={<AlertTriangle size={32} />}
            title="Site introuvable"
            action={<Button onClick={() => navigate('/securitrack/admin/sites')}>Retour</Button>}
          />
        </div>
      </AppShell>
    );
  }

  const aCoords = site.latitude !== null && site.longitude !== null;

  return (
    <AppShell
      title={`SITE-${String(site.id).padStart(5, '0')}`}
      breadcrumb={['NjCam', 'SecuriTrack', 'Sites', `SITE-${site.id}`]}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-5">

        <button
          onClick={() => navigate('/securitrack/admin/sites')}
          className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={16} /> Sites
        </button>

        {/* En-tête */}
        <div className="bg-card border border-line rounded-lg p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="mb-2">
                <StatutSiteBadge statut={site.statut} />
              </div>
              <h1 className="text-xl font-semibold text-ink mb-1 flex items-center gap-2">
                <MapPin size={18} className="text-primary" />
                {site.nom}
              </h1>
              <p className="text-sm text-ink-soft">{site.adresse}</p>
            </div>
          </div>

          {/* Méta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-line">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-md bg-info-soft text-info shrink-0">
                <User size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-ink-soft">Client</p>
                <p className="text-sm font-medium text-ink truncate">{site.client_nom}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-md bg-warning-soft text-warning shrink-0">
                <Wrench size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-ink-soft">Technicien d'étude</p>
                <p className="text-sm font-medium text-ink truncate">
                  {site.technicien_nom || '—'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-md bg-primary-soft text-primary shrink-0">
                <HardDrive size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-ink-soft">Installations</p>
                <p className="text-sm font-medium text-ink">{site.nb_installations}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-line">
            <Button
              variant="secondary"
              icon={<ExternalLink size={15} />}
              onClick={() => navigate('/camtrack/admin/demandes')}
            >
              Voir la demande d'origine
            </Button>
            <Button
              variant="secondary"
              icon={<Building2 size={15} />}
              onClick={() => navigate('/camtrack/admin/installations')}
            >
              Voir les installations
            </Button>
          </div>
        </div>

        {/* Carte */}
        {aCoords ? (
          <div className="bg-card border border-line rounded-lg p-6">
            <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
              <MapPin size={16} /> Position GPS
            </h3>
            <CarteLeaflet
              latitude={site.latitude!}
              longitude={site.longitude!}
              label={site.nom}
              height={400}
              zoom={15}
            />
            <p className="text-xs text-ink-faint mt-2 font-mono text-center">
              {site.latitude!.toFixed(6)}, {site.longitude!.toFixed(6)}
            </p>
          </div>
        ) : (
          <div className="bg-card border border-line rounded-lg p-6 text-center text-sm text-ink-soft">
            Aucune coordonnée GPS renseignée pour ce site.
          </div>
        )}

        {/* Notes */}
        {site.notes_faisabilite && (
          <div className="bg-card border border-line rounded-lg p-6">
            <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
              <FileText size={16} /> Notes de faisabilité
            </h3>
            <p className="text-sm text-ink-soft whitespace-pre-wrap">{site.notes_faisabilite}</p>
          </div>
        )}

        {/* Fichiers */}
        {site.fichiers && site.fichiers.length > 0 && (
          <div className="bg-card border border-line rounded-lg p-6">
            <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
              <FileText size={16} /> Fichiers ({site.fichiers.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {site.fichiers.map((f) => {
                const nom = f.fichier.split('/').pop() || 'fichier';
                const estImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(nom);
                return (
                  <a
                    key={f.id}
                    href={f.fichier}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-surface border border-line rounded-md overflow-hidden hover:border-primary/40 transition-colors"
                  >
                    {estImage ? (
                      <img
                        src={f.fichier}
                        alt={nom}
                        className="w-full h-24 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center bg-card">
                        <FileText size={24} className="text-ink-faint" />
                      </div>
                    )}
                    <p className="px-2 py-1.5 text-[11px] text-ink-soft truncate">{nom}</p>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}