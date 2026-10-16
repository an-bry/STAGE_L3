import { useEffect, useMemo, useState } from 'react';
import {
  Camera, Search, Calendar, Wrench, CheckCircle2,
  User, MapPin,  HardDrive,
} from 'lucide-react';
import { getInstallationsAdmin } from '../../../api/camtrackService';
import type { InstallationAdmin, StatutInstallation } from '../../../types/camtrack';
import AppShell from '../../../components/layout/AppShell';
import Input from '../../../components/ui/input';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import { useToast } from '../../../context/ToastContext';
import { FileText } from 'lucide-react';
import ContratFormModal from '../../../components/securitrack/ContratFormModal';

type TabId = 'toutes' | 'planifiees' | 'en_cours' | 'terminees';

const STATUT_CONFIG: Record<
  StatutInstallation,
  { label: string; variant: 'primary' | 'warning' | 'success'; icon: typeof Calendar }
> = {
  PLANIFIEE: { label: 'Planifiée', variant: 'primary', icon: Calendar },
  EN_COURS: { label: 'En cours', variant: 'warning', icon: Wrench },
  TERMINEE: { label: 'Terminée', variant: 'success', icon: CheckCircle2 },
};

export default function InstallationsAdminPage() {
  const [contratInstall, setContratInstall] = useState<InstallationAdmin | null>(null);
  const toast = useToast();

  const [installations, setInstallations] = useState<InstallationAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('toutes');

  useEffect(() => {
    getInstallationsAdmin()
      .then(setInstallations)
      .catch(() => toast.error('Erreur', 'Impossible de charger les installations.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stats
  const stats = useMemo(
    () => ({
      total: installations.length,
      planifiees: installations.filter((i) => i.statut === 'PLANIFIEE').length,
      enCours: installations.filter((i) => i.statut === 'EN_COURS').length,
      terminees: installations.filter((i) => i.statut === 'TERMINEE').length,
    }),
    [installations]
  );

  // Filtre par onglet
  const parTab = useMemo(() => {
    if (activeTab === 'toutes') return installations;
    if (activeTab === 'planifiees')
      return installations.filter((i) => i.statut === 'PLANIFIEE');
    if (activeTab === 'en_cours')
      return installations.filter((i) => i.statut === 'EN_COURS');
    return installations.filter((i) => i.statut === 'TERMINEE');
  }, [installations, activeTab]);

  // Recherche + tri par id desc
  const affichees = useMemo(() => {
    const tri = [...parTab].sort((a, b) => b.id - a.id);
    if (!recherche.trim()) return tri;
    const q = recherche.toLowerCase();
    return tri.filter(
      (i) =>
        i.site_nom.toLowerCase().includes(q) ||
        i.adresse.toLowerCase().includes(q) ||
        i.client_nom.toLowerCase().includes(q) ||
        (i.technicien_nom && i.technicien_nom.toLowerCase().includes(q))
    );
  }, [parTab, recherche]);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'toutes', label: 'Toutes', count: stats.total },
    { id: 'planifiees', label: 'Planifiées', count: stats.planifiees },
    { id: 'en_cours', label: 'En cours', count: stats.enCours },
    { id: 'terminees', label: 'Terminées', count: stats.terminees },
  ];

  return (
    <AppShell
      title="Suivi des installations"
      breadcrumb={['NjCam', 'CamTrack', 'Installations']}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary-soft text-primary">
              <Camera size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">Total</p>
              <p className="text-xl font-semibold text-ink">{stats.total}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-info-soft text-info">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">Planifiées</p>
              <p className="text-xl font-semibold text-ink">{stats.planifiees}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-warning-soft text-warning">
              <Wrench size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">En cours</p>
              <p className="text-xl font-semibold text-ink">{stats.enCours}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-success-soft text-success">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">Terminées</p>
              <p className="text-xl font-semibold text-ink">{stats.terminees}</p>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="border-b border-line">
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

        {/* Recherche */}
        {installations.length > 0 && (
          <Input
            placeholder="Rechercher par site, client ou technicien…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            icon={<Search size={15} />}
          />
        )}

        {/* Liste */}
        {loading ? (
          <div className="bg-card border border-line rounded-lg p-12 text-center text-sm text-ink-soft">
            Chargement des installations…
          </div>
        ) : installations.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Camera size={24} />}
              title="Aucune installation"
              description="Aucune installation n'a encore été planifiée. Attendez qu'un client accepte un devis."
            />
          </div>
        ) : affichees.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Search size={24} />}
              title="Aucun résultat"
              description={
                recherche.trim()
                  ? `Aucun résultat pour "${recherche}".`
                  : `Aucune installation dans l'onglet "${tabs.find((t) => t.id === activeTab)?.label}".`
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
            {affichees.map((install) => {
              const conf = STATUT_CONFIG[install.statut];
              const StatutIcon = conf.icon;

              return (
                <div
                  key={install.id}
                  className="bg-card border border-line rounded-lg p-4 hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-mono text-xs font-medium text-ink-soft">
                          INST-{String(install.id).padStart(5, '0')}
                        </span>
                        <span className="text-xs text-ink-faint">•</span>
                        <span className="text-xs text-ink-soft">
                          {install.date_installation
                            ? new Date(install.date_installation).toLocaleDateString(
                                'fr-FR'
                              )
                            : 'Date non définie'}
                        </span>
                      </div>

                      {/* Site */}
                      <p className="text-sm font-medium text-ink mb-1">
                        <MapPin size={13} className="inline text-primary mr-1" />
                        {install.site_nom}
                      </p>
                      <p className="text-xs text-ink-soft mb-2">{install.adresse}</p>

                      {/* Méta */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                        <span className="flex items-center gap-1">
                          <User size={11} /> {install.client_nom}
                        </span>
                        {install.technicien_nom && (
                          <span className="flex items-center gap-1">
                            <Wrench size={11} /> {install.technicien_nom}
                          </span>
                        )}
                        {install.equipements.length > 0 && (
                          <span className="flex items-center gap-1">
                            <HardDrive size={11} /> {install.equipements.length}{' '}
                            équipement{install.equipements.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                   {/* Badges + Action */}
<div className="flex flex-col items-end gap-2 shrink-0">
  <Badge variant={conf.variant} dot>
    <StatutIcon size={11} /> {conf.label}
  </Badge>

  {install.statut === 'TERMINEE' && install.equipements.length > 0 && (
    <Button
      variant="success"
      icon={<FileText size={13} />}
      onClick={() => setContratInstall(install)}
    >
      Créer un contrat
    </Button>
  )}
</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {contratInstall && (
  <ContratFormModal
    open={!!contratInstall}
    onClose={() => setContratInstall(null)}
    onSuccess={() => {
      toast.success('Contrat créé', 'Visible dans SecuriTrack → Contrats.');
      setContratInstall(null);
    }}
    clientInitial={contratInstall.client}
    equipementsInitiaux={contratInstall.equipements.map(e => e.id)}
    dureeEngagementMois={contratInstall.duree_engagement_mois}
  />
)}
    </AppShell>
  );
}