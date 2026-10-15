import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Search, Calendar, Wrench, CheckCircle2,
  ArrowRight, User, MapPin, HardDrive,
} from 'lucide-react';
import { getMesInstallations } from '../../../api/camtrackService';
import type { InstallationTechnicien, StatutInstallation } from '../../../types/camtrack';
import AppShell from '../../../components/layout/AppShell';
import Input from '../../../components/ui/input';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import { useToast } from '../../../context/ToastContext';

type TabId = 'planifiees' | 'en_cours' | 'terminees';

const STATUT_CONFIG: Record<
  StatutInstallation,
  { label: string; variant: 'primary' | 'warning' | 'success'; icon: typeof Calendar }
> = {
  PLANIFIEE: { label: 'Planifiée', variant: 'primary', icon: Calendar },
  EN_COURS: { label: 'En cours', variant: 'warning', icon: Wrench },
  TERMINEE: { label: 'Terminée', variant: 'success', icon: CheckCircle2 },
};

export default function MesInstallationsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [installations, setInstallations] = useState<InstallationTechnicien[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('planifiees');

  useEffect(() => {
    getMesInstallations()
      .then(setInstallations)
      .catch(() => toast.error('Erreur', 'Impossible de charger vos installations.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const planifiees = useMemo(
    () => installations.filter((i) => i.statut === 'PLANIFIEE'),
    [installations]
  );
  const enCours = useMemo(
    () => installations.filter((i) => i.statut === 'EN_COURS'),
    [installations]
  );
  const terminees = useMemo(
    () => installations.filter((i) => i.statut === 'TERMINEE'),
    [installations]
  );

  const listeActive = useMemo(() => {
    if (activeTab === 'planifiees') return planifiees;
    if (activeTab === 'en_cours') return enCours;
    return terminees;
  }, [activeTab, planifiees, enCours, terminees]);

  const listeAffichee = useMemo(() => {
    const tri = [...listeActive].sort((a, b) => b.id - a.id);
    if (!recherche.trim()) return tri;
    const q = recherche.toLowerCase();
    return tri.filter(
      (i) =>
        i.site_nom.toLowerCase().includes(q) ||
        i.adresse.toLowerCase().includes(q) ||
        i.client_nom.toLowerCase().includes(q)
    );
  }, [listeActive, recherche]);

  const tabs: { id: TabId; label: string; count: number; icon: typeof Calendar }[] = [
    { id: 'planifiees', label: 'Planifiées', count: planifiees.length, icon: Calendar },
    { id: 'en_cours', label: 'En cours', count: enCours.length, icon: Wrench },
    { id: 'terminees', label: 'Terminées', count: terminees.length, icon: CheckCircle2 },
  ];

  return (
    <AppShell
      title="Mes installations"
      breadcrumb={['NjCam', 'CamTrack', 'Mes installations']}
    >
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary-soft text-primary">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">Planifiées</p>
              <p className="text-xl font-semibold text-ink">{planifiees.length}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-warning-soft text-warning">
              <Wrench size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">En cours</p>
              <p className="text-xl font-semibold text-ink">{enCours.length}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-success-soft text-success">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">Terminées</p>
              <p className="text-xl font-semibold text-ink">{terminees.length}</p>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="border-b border-line">
          <div className="flex items-center gap-1 -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-ink-soft hover:text-ink'
                  }`}
                >
                  <Icon size={14} /> {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Recherche */}
        {installations.length > 0 && (
          <Input
            placeholder="Rechercher par site, adresse ou client…"
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
        ) : installations.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Camera size={24} />}
              title="Aucune installation"
              description="Vous n'avez pas encore d'installation planifiée."
            />
          </div>
        ) : listeAffichee.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Search size={24} />}
              title="Aucun résultat"
              description={
                recherche.trim()
                  ? `Aucun résultat pour "${recherche}".`
                  : activeTab === 'planifiees'
                  ? 'Aucune installation planifiée.'
                  : activeTab === 'en_cours'
                  ? 'Aucune installation en cours.'
                  : 'Aucune installation terminée.'
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
            {listeAffichee.map((install) => {
              const conf = STATUT_CONFIG[install.statut];
              const StatutIcon = conf.icon;

              return (
                <button
                  key={install.id}
                  onClick={() =>
                    navigate(`/camtrack/technicien/installations/${install.id}`)
                  }
                  className="w-full text-left bg-card border border-line rounded-lg p-4 hover:border-primary/40 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-mono text-xs font-medium text-ink-soft">
                          INST-{String(install.id).padStart(5, '0')}
                        </span>
                        <span className="text-xs text-ink-faint">•</span>
                        <span className="text-xs text-ink-soft">
                          {install.date_installation
                            ? new Date(install.date_installation).toLocaleDateString('fr-FR')
                            : 'Date à définir'}
                        </span>
                      </div>

                      <p className="text-sm font-medium text-ink mb-1">
                        <MapPin size={13} className="inline text-primary mr-1" />
                        {install.site_nom}
                      </p>
                      <p className="text-xs text-ink-soft mb-2">{install.adresse}</p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                        <span className="flex items-center gap-1">
                          <User size={11} /> {install.client_nom}
                        </span>
                        {install.equipements.length > 0 && (
                          <span className="flex items-center gap-1">
                            <HardDrive size={11} /> {install.equipements.length}{' '}
                            équipement{install.equipements.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant={conf.variant} dot>
                        <StatutIcon size={11} /> {conf.label}
                      </Badge>
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