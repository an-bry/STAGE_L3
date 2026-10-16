import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HardDrive, Search, CheckCircle2, AlertTriangle, Power,
  MapPin, Wrench,
} from 'lucide-react';
import { equipementsApi } from '../../../api/securitrack';
import type { Equipement } from '../../../types/securitrack';
import AppShell from '../../../components/layout/AppShell';
import Input from '../../../components/ui/input';

import EmptyState from '../../../components/ui/EmptyState';
import { StatutEquipementBadge, GarantieBadge } from '../../../components/securitrack/badges';
import { useToast } from '../../../context/ToastContext';

type TabId = 'tous' | 'actifs' | 'en_panne' | 'hors_service';

export default function MesEquipementsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('tous');

  useEffect(() => {
    equipementsApi.mesEquipements()
      .then(setEquipements)
      .catch(() => toast.error('Erreur', 'Impossible de charger vos équipements.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => ({
    total: equipements.length,
    actifs: equipements.filter(e => e.statut === 'ACTIF').length,
    enPanne: equipements.filter(e => e.statut === 'EN_PANNE').length,
    horsService: equipements.filter(e => e.statut === 'HORS_SERVICE').length,
  }), [equipements]);

  const parTab = useMemo(() => {
    if (activeTab === 'tous') return equipements;
    if (activeTab === 'actifs') return equipements.filter(e => e.statut === 'ACTIF');
    if (activeTab === 'en_panne') return equipements.filter(e => e.statut === 'EN_PANNE');
    return equipements.filter(e => e.statut === 'HORS_SERVICE');
  }, [equipements, activeTab]);

  const affiches = useMemo(() => {
    let liste = [...parTab].sort((a, b) => b.id - a.id);
    if (!recherche.trim()) return liste;
    const q = recherche.toLowerCase();
    return liste.filter(e =>
      e.model.toLowerCase().includes(q) ||
      e.site_nom.toLowerCase().includes(q) ||
      (e.adresse_ip && e.adresse_ip.toLowerCase().includes(q))
    );
  }, [parTab, recherche]);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'tous', label: 'Tous', count: stats.total },
    { id: 'actifs', label: 'Actifs', count: stats.actifs },
    { id: 'en_panne', label: 'En panne', count: stats.enPanne },
    { id: 'hors_service', label: 'Hors service', count: stats.horsService },
  ];

  return (
    <AppShell
      title="Mes équipements"
      breadcrumb={['NjCam', 'SecuriTrack', 'Mes équipements']}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary-soft text-primary"><HardDrive size={18} /></div>
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
            <div className="p-2 rounded-md bg-danger-soft text-danger"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-xs text-ink-soft">En panne</p>
              <p className="text-xl font-semibold text-ink">{stats.enPanne}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-surface text-ink-soft"><Power size={18} /></div>
            <div>
              <p className="text-xs text-ink-soft">Hors service</p>
              <p className="text-xl font-semibold text-ink">{stats.horsService}</p>
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

        {equipements.length > 0 && (
          <Input
            placeholder="Rechercher par modèle, IP ou site…"
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
        ) : equipements.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<HardDrive size={24} />}
              title="Aucun équipement"
              description="Vous n'avez aucun équipement enregistré."
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
            {affiches.map((eq) => (
              <div
                key={eq.id}
                className="bg-card border border-line rounded-lg p-4 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => navigate(`/securitrack/client/equipements/${eq.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-xs font-medium text-ink-soft">
                        EQ-{String(eq.id).padStart(5, '0')}
                      </span>
                      <span className="text-xs text-ink-faint">•</span>
                      <span className="text-xs text-ink-soft">{eq.type_equipement}</span>
                      {eq.adresse_ip && (
                        <>
                          <span className="text-xs text-ink-faint">•</span>
                          <span className="text-xs font-mono text-ink-soft">{eq.adresse_ip}</span>
                        </>
                      )}
                    </div>

                    <p className="text-sm font-medium text-ink mb-1">{eq.model}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {eq.site_nom}
                      </span>
                      {eq.nb_maintenances > 0 && (
                        <span className="flex items-center gap-1">
                          <Wrench size={11} /> {eq.nb_maintenances} maintenance{eq.nb_maintenances > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatutEquipementBadge statut={eq.statut} />
                    <GarantieBadge jours={eq.garantie_jours_restants} expiree={eq.garantie_expiree} />
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