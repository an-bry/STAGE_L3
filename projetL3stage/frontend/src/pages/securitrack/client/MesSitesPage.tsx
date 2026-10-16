import { useEffect, useMemo, useState } from 'react';
import { MapPin, Search, HardDrive, Wrench, Building2, FileText } from 'lucide-react';
import { sitesApi } from '../../../api/securitrack';
import type { Site } from '../../../types/securitrack';
import AppShell from '../../../components/layout/AppShell';
import Input from '../../../components/ui/input';
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

export default function MesSitesPage() {
  const toast = useToast();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    sitesApi.mesSites()
      .then(setSites)
      .catch(() => toast.error('Erreur', 'Impossible de charger vos sites.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const affiches = useMemo(() => {
    let liste = [...sites].sort((a, b) => b.id - a.id);
    if (!recherche.trim()) return liste;
    const q = recherche.toLowerCase();
    return liste.filter(s =>
      s.nom.toLowerCase().includes(q) || s.adresse.toLowerCase().includes(q)
    );
  }, [sites, recherche]);

  return (
    <AppShell
      title="Mes sites"
      breadcrumb={['NjCam', 'SecuriTrack', 'Mes sites']}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {sites.length > 0 && (
          <Input
            placeholder="Rechercher par nom ou adresse…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            icon={<Search size={15} />}
          />
        )}

        {loading ? (
          <div className="bg-card border border-line rounded-lg p-12 text-center text-sm text-ink-soft">
            Chargement…
          </div>
        ) : sites.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Building2 size={24} />}
              title="Aucun site"
              description="Vous n'avez aucun site enregistré."
            />
          </div>
        ) : affiches.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Search size={24} />}
              title="Aucun résultat"
              description={`Rien pour "${recherche}".`}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {affiches.map((s) => (
              <div key={s.id} className="bg-card border border-line rounded-lg overflow-hidden">
                {/* Carte en haut si coordonnées */}
                {s.latitude !== null && s.longitude !== null && (
                  <div className="pointer-events-none">
                    <CarteLeaflet
                      latitude={s.latitude}
                      longitude={s.longitude}
                      height={140}
                      zoom={14}
                    />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink flex items-center gap-1.5">
                        <MapPin size={13} className="text-primary" />
                        {s.nom}
                      </p>
                      <p className="text-xs text-ink-soft mt-0.5 truncate">{s.adresse}</p>
                    </div>
                    <StatutSiteBadge statut={s.statut} />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft pt-2 border-t border-line">
                    <span className="flex items-center gap-1">
                      <HardDrive size={11} /> {s.nb_installations} installation{s.nb_installations > 1 ? 's' : ''}
                    </span>
                    {s.technicien_nom && (
                      <span className="flex items-center gap-1">
                        <Wrench size={11} /> {s.technicien_nom}
                      </span>
                    )}
                    {s.fichiers.length > 0 && (
                      <span className="flex items-center gap-1">
                        <FileText size={11} /> {s.fichiers.length} fichier{s.fichiers.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}