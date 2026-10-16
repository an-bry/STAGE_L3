import { useEffect, useMemo, useState } from 'react';

import {
  Wrench, Search, Calendar, CheckCircle2, Clock, AlertTriangle,
  Plus, User, HardDrive, MapPin, Pencil, Trash2,
} from 'lucide-react';
import { maintenancesApi } from '../../../api/securitrack';
import type { Maintenance} from '../../../types/securitrack';
import AppShell from '../../../components/layout/AppShell';
import Input from '../../../components/ui/input';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import { StatutMaintenanceBadge } from '../../../components/securitrack/badges';
import MaintenanceFormModal from '../../../components/securitrack/MaintenanceFormModal';
import { useToast } from '../../../context/ToastContext';

type TabId = 'toutes' | 'planifiees' | 'en_cours' | 'terminees' | 'en_retard';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR');
}

export default function MaintenancesPage() {
  const toast = useToast();

  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('toutes');

  // Modal création / édition
  const [formOpen, setFormOpen] = useState(false);
  const [maintenanceEdit, setMaintenanceEdit] = useState<Maintenance | null>(null);

  // Modal suppression
  const [suppression, setSuppression] = useState<Maintenance | null>(null);
  const [deleting, setDeleting] = useState(false);

  const charger = () => {
    setLoading(true);
    maintenancesApi.list()
      .then(setMaintenances)
      .catch(() => toast.error('Erreur', 'Impossible de charger les maintenances.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stats
  const stats = useMemo(() => ({
    total: maintenances.length,
    planifiees: maintenances.filter(m => m.statut === 'PLANIFIEE').length,
    enCours: maintenances.filter(m => m.statut === 'EN_COURS').length,
    terminees: maintenances.filter(m => m.statut === 'TERMINEE').length,
    enRetard: maintenances.filter(m => m.en_retard).length,
  }), [maintenances]);

  // Filtre onglet
  const parTab = useMemo(() => {
    if (activeTab === 'toutes') return maintenances;
    if (activeTab === 'planifiees') return maintenances.filter(m => m.statut === 'PLANIFIEE');
    if (activeTab === 'en_cours') return maintenances.filter(m => m.statut === 'EN_COURS');
    if (activeTab === 'terminees') return maintenances.filter(m => m.statut === 'TERMINEE');
    return maintenances.filter(m => m.en_retard);
  }, [maintenances, activeTab]);

  // Recherche + tri (en retard en premier, puis date asc)
  const affichees = useMemo(() => {
    let liste = [...parTab].sort((a, b) => {
      if (a.en_retard !== b.en_retard) return a.en_retard ? -1 : 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    if (!recherche.trim()) return liste;
    const q = recherche.toLowerCase();
    return liste.filter(m =>
      m.equipement_detail.model.toLowerCase().includes(q) ||
      (m.technicien_nom && m.technicien_nom.toLowerCase().includes(q)) ||
      m.site_nom.toLowerCase().includes(q) ||
      m.client_nom.toLowerCase().includes(q)
    );
  }, [parTab, recherche]);

  const handleSupprimer = async () => {
    if (!suppression) return;
    setDeleting(true);
    try {
      await maintenancesApi.delete(suppression.id);
      toast.success('Maintenance supprimée', '');
      setSuppression(null);
      charger();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error('Erreur', detail || 'Impossible de supprimer.');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditer = (m: Maintenance) => {
    if (m.statut !== 'PLANIFIEE') {
      toast.error('Action impossible', 'Seule une maintenance planifiée peut être modifiée.');
      return;
    }
    setMaintenanceEdit(m);
    setFormOpen(true);
  };

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'toutes', label: 'Toutes', count: stats.total },
    { id: 'planifiees', label: 'Planifiées', count: stats.planifiees },
    { id: 'en_cours', label: 'En cours', count: stats.enCours },
    { id: 'terminees', label: 'Terminées', count: stats.terminees },
    { id: 'en_retard', label: 'En retard', count: stats.enRetard },
  ];

  return (
    <AppShell
      title="Maintenances préventives"
      breadcrumb={['NjCam', 'SecuriTrack', 'Maintenances']}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-danger-soft text-danger"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-xs text-ink-soft">En retard</p>
              <p className="text-xl font-semibold text-ink">{stats.enRetard}</p>
            </div>
          </div>
        </div>

        {/* Onglets + bouton */}
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
            onClick={() => { setMaintenanceEdit(null); setFormOpen(true); }}
          >
            Planifier une maintenance
          </Button>
        </div>

        {/* Recherche */}
        {maintenances.length > 0 && (
          <Input
            placeholder="Rechercher par équipement, technicien, site ou client…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            icon={<Search size={15} />}
          />
        )}

        {/* Liste */}
        {loading ? (
          <div className="bg-card border border-line rounded-lg p-12 text-center text-sm text-ink-soft">
            Chargement des maintenances…
          </div>
        ) : maintenances.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Wrench size={24} />}
              title="Aucune maintenance"
              description="Planifiez la première maintenance préventive sur un équipement sous contrat."
              action={
                <Button icon={<Plus size={15} />} onClick={() => setFormOpen(true)}>
                  Planifier une maintenance
                </Button>
              }
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
                  : 'Aucune maintenance dans ce filtre.'
              }
              action={
                (recherche.trim() || activeTab !== 'toutes') ? (
                  <Button
                    variant="secondary"
                    onClick={() => { setRecherche(''); setActiveTab('toutes'); }}
                  >
                    Réinitialiser les filtres
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="space-y-2">
            {affichees.map((m) => (
              <div
                key={m.id}
                className={`bg-card border rounded-lg p-4 transition-all ${
                  m.en_retard
                    ? 'border-danger/40 bg-danger-soft/10'
                    : 'border-line hover:border-primary/40 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-xs font-medium text-ink-soft">
                        MNT-{String(m.id).padStart(5, '0')}
                      </span>
                      {m.en_retard && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger text-white font-medium flex items-center gap-1">
                          <AlertTriangle size={10} /> EN RETARD
                        </span>
                      )}
                    </div>

                    {/* Équipement */}
                    <p className="text-sm font-medium text-ink mb-1 flex items-center gap-1.5">
                      <HardDrive size={13} className="text-primary" />
                      {m.equipement_detail.model} — {m.equipement_detail.type_equipement}
                    </p>

                    {/* Méta */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {formatDate(m.date)}
                      </span>
                      {m.technicien_nom && (
                        <span className="flex items-center gap-1">
                          <User size={11} /> {m.technicien_nom}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {m.site_nom}
                      </span>
                      <span className="text-ink-faint">• {m.client_nom}</span>
                    </div>

                    {/* Compte rendu si terminée */}
                    {m.statut === 'TERMINEE' && m.compte_rendu && (
                      <p className="text-xs text-ink-soft mt-2 line-clamp-2 italic">
                        « {m.compte_rendu} »
                      </p>
                    )}
                  </div>

                  {/* Badges + actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatutMaintenanceBadge statut={m.statut} />
                    {m.statut === 'PLANIFIEE' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditer(m)}
                          className="p-1.5 rounded text-ink-soft hover:bg-surface hover:text-primary transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setSuppression(m)}
                          className="p-1.5 rounded text-ink-soft hover:bg-danger-soft hover:text-danger transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal formulaire */}
      <MaintenanceFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setMaintenanceEdit(null); }}
        onSuccess={charger}
        maintenance={maintenanceEdit}
      />

      {/* Modal suppression */}
      <Modal
        open={!!suppression}
        onClose={() => setSuppression(null)}
        title="Supprimer la maintenance"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSuppression(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleSupprimer} loading={deleting} icon={<Trash2 size={15} />}>
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          Voulez-vous vraiment supprimer la maintenance
          {suppression && (
            <> du <strong>{formatDate(suppression.date)}</strong> pour{' '}
              <strong>{suppression.equipement_detail.model}</strong> ?</>
          )}
        </p>
        <div className="bg-warning-soft border border-warning/30 rounded-md p-3 flex items-start gap-2 text-xs text-warning mt-3">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>Cette action est irréversible.</span>
        </div>
      </Modal>
    </AppShell>
  );
}