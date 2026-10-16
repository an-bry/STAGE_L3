import { useEffect, useMemo, useState } from 'react';
import {
  Wrench, Search, Calendar, CheckCircle2, Clock, MapPin,
  HardDrive, MessageSquare,
} from 'lucide-react';
import { maintenancesApi } from '../../../api/securitrack';
import type { Maintenance } from '../../../types/securitrack';
import AppShell from '../../../components/layout/AppShell';
import Input from '../../../components/ui/input';
import EmptyState from '../../../components/ui/EmptyState';
import { StatutMaintenanceBadge } from '../../../components/securitrack/badges';
import { useToast } from '../../../context/ToastContext';

type TabId = 'toutes' | 'planifiees' | 'en_cours' | 'terminees';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR');
}

export default function MesMaintenancesPage() {
  const toast = useToast();
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('toutes');

  useEffect(() => {
    maintenancesApi.mesMaintenances()
      .then(setMaintenances)
      .catch(() => toast.error('Erreur', 'Impossible de charger vos maintenances.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => ({
    total: maintenances.length,
    planifiees: maintenances.filter(m => m.statut === 'PLANIFIEE').length,
    enCours: maintenances.filter(m => m.statut === 'EN_COURS').length,
    terminees: maintenances.filter(m => m.statut === 'TERMINEE').length,
  }), [maintenances]);

  const parTab = useMemo(() => {
    if (activeTab === 'toutes') return maintenances;
    if (activeTab === 'planifiees') return maintenances.filter(m => m.statut === 'PLANIFIEE');
    if (activeTab === 'en_cours') return maintenances.filter(m => m.statut === 'EN_COURS');
    return maintenances.filter(m => m.statut === 'TERMINEE');
  }, [maintenances, activeTab]);

  const affichees = useMemo(() => {
    let liste = [...parTab].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (!recherche.trim()) return liste;
    const q = recherche.toLowerCase();
    return liste.filter(m =>
      m.equipement_detail.model.toLowerCase().includes(q) ||
      m.site_nom.toLowerCase().includes(q)
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
      title="Mes maintenances"
      breadcrumb={['NjCam', 'SecuriTrack', 'Mes maintenances']}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary-soft text-primary"><Wrench size={18} /></div>
            <div>
              <p className="text-xs text-ink-soft">Total</p>
              <p className="text-xl font-semibold text-ink">{stats.total}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-info-soft text-info"><Calendar size={18} /></div>
            <div>
              <p className="text-xs text-ink-soft">Planifiées</p>
              <p className="text-xl font-semibold text-ink">{stats.planifiees}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-warning-soft text-warning"><Clock size={18} /></div>
            <div>
              <p className="text-xs text-ink-soft">En cours</p>
              <p className="text-xl font-semibold text-ink">{stats.enCours}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-success-soft text-success"><CheckCircle2 size={18} /></div>
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

        {maintenances.length > 0 && (
          <Input
            placeholder="Rechercher par équipement ou site…"
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
        ) : maintenances.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Wrench size={24} />}
              title="Aucune maintenance"
              description="Aucune intervention préventive n'est planifiée sur vos équipements."
            />
          </div>
        ) : affichees.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Search size={24} />}
              title="Aucun résultat"
              description={`Rien pour "${recherche || activeTab}".`}
            />
          </div>
        ) : (
          <div className="space-y-2">
            {affichees.map((m) => (
              <div key={m.id} className="bg-card border border-line rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs font-medium text-ink-soft">
                        MNT-{String(m.id).padStart(5, '0')}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-ink mb-1 flex items-center gap-1.5">
                      <HardDrive size={13} className="text-primary" />
                      {m.equipement_detail.model} — {m.equipement_detail.type_equipement}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {formatDate(m.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {m.site_nom}
                      </span>
                      {m.technicien_nom && (
                        <span className="text-ink-faint">• {m.technicien_nom}</span>
                      )}
                    </div>

                    {m.statut === 'TERMINEE' && m.compte_rendu && (
                      <div className="mt-3 bg-success-soft border border-success/20 rounded-md p-3">
                        <p className="text-[11px] font-medium text-success mb-1 flex items-center gap-1">
                          <MessageSquare size={11} /> Compte rendu du technicien
                        </p>
                        <p className="text-xs text-ink-soft italic">« {m.compte_rendu} »</p>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0">
                    <StatutMaintenanceBadge statut={m.statut} />
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