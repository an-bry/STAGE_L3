import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Search, ArrowRight, Clock, CheckCircle2,
  ClipboardList, Building2,
} from 'lucide-react';
import { getMesEtudes } from '../../../api/camtrackService';
import type { SiteTechnicien, StatutSite } from '../../../types/camtrack';
import AppShell from '../../../components/layout/AppShell';
import Input from '../../../components/ui/input';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import { useToast } from '../../../context/ToastContext';

type TabId = 'a_etudier' | 'valides';

const STATUT_CONFIG: Record<StatutSite, { label: string; variant: 'warning' | 'success' }> = {
  EN_ETUDE: { label: 'À étudier', variant: 'warning' },
  VALIDE: { label: 'Validé', variant: 'success' },
};

export default function MesEtudesPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [sites, setSites] = useState<SiteTechnicien[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('a_etudier');

  useEffect(() => {
    getMesEtudes()
      .then(setSites)
      .catch(() => toast.error('Erreur', 'Impossible de charger vos études.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aEtudier = useMemo(() => sites.filter((s) => s.statut === 'EN_ETUDE'), [sites]);
  const valides = useMemo(() => sites.filter((s) => s.statut === 'VALIDE'), [sites]);

  const sitesAffiches = useMemo(() => {
    const base = activeTab === 'a_etudier' ? aEtudier : valides;
    const tri = [...base].sort((a, b) => b.id - a.id);
    if (!recherche.trim()) return tri;
    const q = recherche.toLowerCase();
    return tri.filter(
      (s) =>
        s.nom.toLowerCase().includes(q) ||
        s.adresse.toLowerCase().includes(q) ||
        s.demande.client.username.toLowerCase().includes(q)
    );
  }, [activeTab, aEtudier, valides, recherche]);

  return (
    <AppShell title="Mes études de site" breadcrumb={['NjCam', 'CamTrack', 'Mes études']}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-warning-soft text-warning">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">À étudier</p>
              <p className="text-xl font-semibold text-ink">{aEtudier.length}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-success-soft text-success">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">Validés</p>
              <p className="text-xl font-semibold text-ink">{valides.length}</p>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="border-b border-line">
          <div className="flex items-center gap-1 -mb-px">
            <button
              onClick={() => setActiveTab('a_etudier')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'a_etudier'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              <Clock size={14} /> À étudier ({aEtudier.length})
            </button>
            <button
              onClick={() => setActiveTab('valides')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'valides'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              <CheckCircle2 size={14} /> Validés ({valides.length})
            </button>
          </div>
        </div>

        {/* Recherche */}
        {sites.length > 0 && (
          <Input
            placeholder="Rechercher par nom, adresse ou client…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            icon={<Search size={15} />}
          />
        )}

        {/* Liste */}
        {loading ? (
          <div className="bg-card border border-line rounded-lg p-12 text-center text-sm text-ink-soft">
            Chargement…
          </div>
        ) : sites.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<ClipboardList size={24} />}
              title="Aucune étude pour l'instant"
              description="Vous n'avez pas encore de site à étudier."
            />
          </div>
        ) : sitesAffiches.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Search size={24} />}
              title="Aucun résultat"
              description={
                recherche.trim()
                  ? `Aucun résultat pour "${recherche}".`
                  : activeTab === 'a_etudier'
                  ? 'Aucune étude en attente. Bravo !'
                  : "Vous n'avez pas encore validé d'étude."
              }
              action={
                recherche.trim() ? (
                  <Button variant="secondary" onClick={() => setRecherche('')}>
                    Effacer la recherche
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="space-y-2">
            {sitesAffiches.map((site) => {
              const conf = STATUT_CONFIG[site.statut];
              return (
                <button
                  key={site.id}
                  onClick={() => navigate(`/camtrack/technicien/etudes/${site.id}`)}
                  className="w-full text-left bg-card border border-line rounded-lg p-4 hover:border-primary/40 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-ink-soft flex items-center gap-1">
                          <Building2 size={12} />
                          DEM-{String(site.demande.id).padStart(5, '0')}
                        </span>
                        <span className="text-xs text-ink-faint">•</span>
                        <span className="text-xs text-ink-soft">
                          {site.demande.client.username}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-ink mb-1">{site.nom}</p>
                      <p className="text-xs text-ink-soft flex items-center gap-1">
                        <MapPin size={11} /> {site.adresse}
                      </p>
                      <p className="text-xs text-ink-soft mt-1">
                        Offre : {site.demande.offre.nom}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant={conf.variant} dot>
                        {conf.label}
                      </Badge>
                      {site.fichiers.length > 0 && (
                        <span className="text-xs text-ink-soft">
                          {site.fichiers.length} fichier
                          {site.fichiers.length > 1 ? 's' : ''}
                        </span>
                      )}
                      <ArrowRight
                        size={16}
                        className="text-ink-faint group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1"
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}