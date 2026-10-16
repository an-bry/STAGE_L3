import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Search, Plus, Building2, CheckCircle2, Clock,
  Wrench, HardDrive, Pencil,
} from 'lucide-react';
import { sitesApi } from '../../../api/securitrack';
import type { Site } from '../../../types/securitrack';
import AppShell from '../../../components/layout/AppShell';
import Input from '../../../components/ui/input';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import SiteFormModal from '../../../components/securitrack/SiteFormModal';
import { useToast } from '../../../context/ToastContext';

type TabId = 'tous' | 'en_etude' | 'valides' | 'autres';

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

export default function SitesPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('tous');

  const [formOpen, setFormOpen] = useState(false);
  const [siteEdit, setSiteEdit] = useState<Site | null>(null);

  const charger = () => {
    setLoading(true);
    sitesApi.list()
      .then(setSites)
      .catch(() => toast.error('Erreur', 'Impossible de charger les sites.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => ({
    total: sites.length,
    enEtude: sites.filter(s => s.statut === 'EN_ETUDE').length,
    valides: sites.filter(s => s.statut === 'VALIDE').length,
    avecCoords: sites.filter(s => s.latitude !== null && s.longitude !== null).length,
  }), [sites]);

  const parTab = useMemo(() => {
    if (activeTab === 'tous') return sites;
    if (activeTab === 'en_etude') return sites.filter(s => s.statut === 'EN_ETUDE');
    if (activeTab === 'valides') return sites.filter(s => s.statut === 'VALIDE');
    return sites.filter(s => s.statut !== 'EN_ETUDE' && s.statut !== 'VALIDE');
  }, [sites, activeTab]);

  const affiches = useMemo(() => {
    let liste = [...parTab].sort((a, b) => b.id - a.id);
    if (!recherche.trim()) return liste;
    const q = recherche.toLowerCase();
    return liste.filter(s =>
      s.nom.toLowerCase().includes(q) ||
      s.adresse.toLowerCase().includes(q) ||
      s.client_nom.toLowerCase().includes(q)
    );
  }, [parTab, recherche]);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'tous', label: 'Tous', count: stats.total },
    { id: 'en_etude', label: 'En étude', count: stats.enEtude },
    { id: 'valides', label: 'Validés', count: stats.valides },
    { id: 'autres', label: 'Autres', count: stats.total - stats.enEtude - stats.valides },
  ];

  return (
    <AppShell
      title="Sites"
      breadcrumb={['NjCam', 'SecuriTrack', 'Sites']}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary-soft text-primary"><Building2 size={18} /></div>
            <div>
              <p className="text-xs text-ink-soft">Total</p>
              <p className="text-xl font-semibold text-ink">{stats.total}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-warning-soft text-warning"><Clock size={18} /></div>
            <div>
              <p className="text-xs text-ink-soft">En étude</p>
              <p className="text-xl font-semibold text-ink">{stats.enEtude}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-success-soft text-success"><CheckCircle2 size={18} /></div>
            <div>
              <p className="text-xs text-ink-soft">Validés</p>
              <p className="text-xl font-semibold text-ink">{stats.valides}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-info-soft text-info"><MapPin size={18} /></div>
            <div>
              <p className="text-xs text-ink-soft">Géolocalisés</p>
              <p className="text-xl font-semibold text-ink">{stats.avecCoords}</p>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="border-b border-line flex-1 min-w-0">
            <div className="flex items-center gap-1 -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-ink-soft hover:text-ink'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-ink-soft">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <Button
            icon={<Plus size={15} />}
            onClick={() => { setSiteEdit(null); setFormOpen(true); }}
          >
            Nouveau site
          </Button>
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
            Chargement des sites…
          </div>
        ) : sites.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Building2 size={24} />}
              title="Aucun site"
              description="Les sites sont créés dans CamTrack lors de l'étude d'une demande."
            />
          </div>
        ) : affiches.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Search size={24} />}
              title="Aucun résultat"
              description={`Rien pour "${recherche || activeTab}".`}
            />
          </div>
        ) : (
          <div className="space-y-2">
            {affiches.map((s) => (
              <div
                key={s.id}
                className="bg-card border border-line rounded-lg p-4 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => navigate(`/securitrack/admin/sites/${s.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-xs font-medium text-ink-soft">
                        SITE-{String(s.id).padStart(5, '0')}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-ink mb-1 flex items-center gap-1.5">
                      <MapPin size={13} className="text-primary" />
                      {s.nom}
                    </p>
                    <p className="text-xs text-ink-soft mb-2 truncate">{s.adresse}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                      {s.client_nom && <span>{s.client_nom}</span>}
                      {s.technicien_nom && (
                        <span className="flex items-center gap-1">
                          <Wrench size={11} /> {s.technicien_nom}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <HardDrive size={11} /> {s.nb_installations} installation{s.nb_installations > 1 ? 's' : ''}
                      </span>
                      {s.latitude !== null && (
                        <span className="text-ink-faint font-mono text-[10px]">
                          {s.latitude.toFixed(4)}, {s.longitude?.toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatutSiteBadge statut={s.statut} />
                    <button
                      onClick={(e) => { e.stopPropagation(); setSiteEdit(s); setFormOpen(true); }}
                      className="p-1.5 rounded text-ink-soft hover:bg-surface hover:text-primary transition-colors"
                      title="Modifier"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SiteFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setSiteEdit(null); }}
        onSuccess={charger}
        site={siteEdit}
      />
    </AppShell>
  );
}