import { useEffect, useMemo, useState } from 'react';
import {
  Wrench, Search, Calendar, CheckCircle2, Clock, AlertTriangle,
  Plus, User, HardDrive, MapPin, Pencil, Trash2, Building2, ChevronRight
} from 'lucide-react';
import { maintenancesApi, equipementsApi } from '../../../api/securitrack';
import type { Maintenance, Equipement } from '../../../types/securitrack';
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
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function MaintenancesPage() {
  const toast = useToast();

  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [equipementsSansMaintenance, setEquipementsSansMaintenance] = useState<Equipement[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('toutes');

  const [formOpen, setFormOpen] = useState(false);
  const [maintenanceEdit, setMaintenanceEdit] = useState<Maintenance | null>(null);
  const [equipementSelectionne, setEquipementSelectionne] = useState<Equipement | null>(null);

  const [suppression, setSuppression] = useState<Maintenance | null>(null);
  const [deleting, setDeleting] = useState(false);

  const charger = async () => {
    setLoading(true);
    try {
      const maints = await maintenancesApi.list();
      setMaintenances(maints);

      const tousEquipements = await equipementsApi.list();
      const equipementsAvecMaintenanceActive = maints
        .filter((m: any) => m.statut === 'PLANIFIEE' || m.statut === 'EN_COURS')
        .map((m: any) => m.equipement);
      
      const aMaintenir = tousEquipements.filter(
        (eq: any) => !equipementsAvecMaintenanceActive.includes(eq.id)
      );
      
      setEquipementsSansMaintenance(aMaintenir);

    } catch (err) {
      console.error(err);
      toast.error('Erreur', 'Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const stats = useMemo(() => ({
    total: maintenances.length,
    planifiees: maintenances.filter(m => m.statut === 'PLANIFIEE').length,
    enCours: maintenances.filter(m => m.statut === 'EN_COURS').length,
    terminees: maintenances.filter(m => m.statut === 'TERMINEE').length,
    enRetard: maintenances.filter(m => m.en_retard).length,
  }), [maintenances]);

  const parTab = useMemo(() => {
    if (activeTab === 'toutes') return maintenances;
    if (activeTab === 'planifiees') return maintenances.filter(m => m.statut === 'PLANIFIEE');
    if (activeTab === 'en_cours') return maintenances.filter(m => m.statut === 'EN_COURS');
    if (activeTab === 'terminees') return maintenances.filter(m => m.statut === 'TERMINEE');
    return maintenances.filter(m => m.en_retard);
  }, [maintenances, activeTab]);

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
      toast.error('Erreur', err?.response?.data?.detail || 'Impossible de supprimer.');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditer = (m: Maintenance, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (m.statut !== 'PLANIFIEE') {
      toast.error('Action impossible', 'Seule une maintenance planifiée peut être modifiée.');
      return;
    }
    setMaintenanceEdit(m);
    setEquipementSelectionne(null);
    setFormOpen(true);
  };

  const handlePlanifierPourEquipement = (eq: Equipement) => {
    setMaintenanceEdit(null);
    setEquipementSelectionne(eq);
    setFormOpen(true);
  };

  const tabs = [
    { id: 'toutes', label: 'Toutes', count: stats.total },
    { id: 'planifiees', label: 'Planifiées', count: stats.planifiees },
    { id: 'en_cours', label: 'En cours', count: stats.enCours },
    { id: 'terminees', label: 'Terminées', count: stats.terminees },
    { id: 'en_retard', label: 'En retard', count: stats.enRetard },
  ] as const;

  return (
    <AppShell title="Maintenances préventives" breadcrumb={['NjCam', 'SecuriTrack', 'Maintenances']}>
      <div className="p-6 max-w-7xl mx-auto space-y-8">

        {/* 🚨 ALERTE */}
        {equipementsSansMaintenance.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-xl shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-orange-900 mb-1">
                  {equipementsSansMaintenance.length} équipement(s) nécessitent une maintenance
                </h3>
                <p className="text-sm text-orange-700/80 mb-5">
                  Ces équipements sous contrat n'ont aucune intervention préventive planifiée.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {equipementsSansMaintenance.map((eq) => (
                    <div key={eq.id} className="bg-white border border-orange-100 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                      <div>
                        <p className="font-bold text-ink flex items-center gap-2">
                          <HardDrive size={16} className="text-primary" /> {eq.model}
                        </p>
                        <div className="text-sm text-ink-soft mt-2 space-y-1">
                          <p className="flex items-center gap-2"><Building2 size={14} /> {eq.client_nom}</p>
                          <p className="flex items-center gap-2"><MapPin size={14} /> {eq.site_nom}</p>
                        </div>
                      </div>
                      <Button 
                        variant="secondary" 
                        className="mt-4 w-full text-sm py-2 bg-orange-100 text-orange-800 hover:bg-orange-200 border-none"
                        onClick={() => handlePlanifierPourEquipement(eq)}
                      >
                        <Calendar size={16} className="mr-2" /> Planifier l'intervention
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total" value={stats.total} icon={<Wrench size={20} />} color="text-primary bg-primary-soft" />
          <StatCard label="Planifiées" value={stats.planifiees} icon={<Calendar size={20} />} color="text-blue-600 bg-blue-50" />
          <StatCard label="En cours" value={stats.enCours} icon={<Clock size={20} />} color="text-orange-600 bg-orange-50" />
          <StatCard label="Terminées" value={stats.terminees} icon={<CheckCircle2 size={20} />} color="text-green-600 bg-green-50" />
          <StatCard label="En retard" value={stats.enRetard} icon={<AlertTriangle size={20} />} color="text-red-600 bg-red-50" />
        </div>

        {/* ONGLETS + BOUTON */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-ink-soft hover:bg-surface'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-surface border border-line'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <Button icon={<Plus size={18} />} onClick={() => { setMaintenanceEdit(null); setEquipementSelectionne(null); setFormOpen(true); }}>
            Planifier une maintenance
          </Button>
        </div>

        {/* RECHERCHE */}
        {maintenances.length > 0 && (
          <Input
            placeholder="Rechercher par équipement, technicien, site ou client…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            icon={<Search size={18} />}
            className="max-w-md bg-surface border-none shadow-sm"
          />
        )}

        {/* LISTE DES MAINTENANCES */}
        {loading ? (
          <div className="flex justify-center py-20 text-ink-soft">Chargement des maintenances…</div>
        ) : affichees.length === 0 ? (
          <div className="bg-card border border-line rounded-2xl shadow-sm">
            <EmptyState
              icon={<Wrench size={32} className="text-ink-faint" />}
              title="Aucune maintenance"
              description="Planifiez la première maintenance préventive sur un équipement sous contrat."
              action={<Button icon={<Plus size={18} />} onClick={() => setFormOpen(true)}>Planifier une maintenance</Button>}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {affichees.map((m) => (
              <div
                key={m.id}
                onClick={() => handleEditer(m)}
                className={`bg-card border rounded-xl p-5 transition-all duration-200 cursor-pointer group flex flex-col sm:flex-row sm:items-center gap-5 ${
                  m.en_retard
                    ? 'border-red-200 bg-red-50/30 hover:border-red-400 hover:shadow-md'
                    : 'border-line hover:border-primary/40 hover:shadow-md'
                }`}
              >
                {/* Bloc Date */}
                <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                  m.en_retard ? 'bg-red-100 text-red-700 border-red-200' : 
                  m.statut === 'TERMINEE' ? 'bg-gray-100 text-gray-500 border-gray-200' : 
                  'bg-primary-soft text-primary border-primary/20'
                }`}>
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {new Date(m.date).toLocaleDateString('fr-FR', { month: 'short' })}
                  </span>
                  <span className="text-xl font-extrabold leading-none">
                    {new Date(m.date).getDate()}
                  </span>
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-mono text-[11px] font-semibold text-ink-soft bg-surface px-2 py-0.5 rounded-md border border-line">
                      MNT-{String(m.id).padStart(5, '0')}
                    </span>
                    {m.en_retard && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-500 text-white font-bold tracking-wide flex items-center gap-1">
                        <AlertTriangle size={12} /> EN RETARD
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-ink mb-1.5 group-hover:text-primary transition-colors flex items-center gap-2">
                    <HardDrive size={18} className="text-primary" />
                    {m.equipement_detail.model} 
                    <span className="text-sm font-normal text-ink-soft">({m.equipement_detail.type_equipement})</span>
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
                    <span className="flex items-center gap-1.5 bg-surface px-2 py-1 rounded-md">
                      <Building2 size={14} className="text-ink-faint" /> {m.client_nom}
                    </span>
                    <span className="flex items-center gap-1.5 bg-surface px-2 py-1 rounded-md">
                      <MapPin size={14} className="text-ink-faint" /> {m.site_nom}
                    </span>
                    {m.technicien_nom && (
                      <span className="flex items-center gap-1.5 text-primary bg-primary-soft/50 px-2 py-1 rounded-md font-medium">
                        <User size={14} /> {m.technicien_nom}
                      </span>
                    )}
                  </div>
                </div>

                {/* Statut & Actions */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 sm:border-l sm:border-line sm:pl-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink bg-surface px-3 py-1.5 rounded-lg">
                    <Clock size={16} className="text-ink-faint" />
                    {new Date(m.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <StatutMaintenanceBadge statut={m.statut} />
                    {m.statut === 'PLANIFIEE' && (
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => handleEditer(m, e)} className="p-2 rounded-lg text-ink-soft hover:bg-surface hover:text-primary transition-colors" title="Modifier">
                          <Pencil size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setSuppression(m); }} className="p-2 rounded-lg text-ink-soft hover:bg-red-50 hover:text-red-600 transition-colors" title="Supprimer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <ChevronRight size={24} className="hidden sm:block text-ink-faint group-hover:text-primary group-hover:translate-x-1 transition-all ml-2" />
              </div>
            ))}
          </div>
        )}
      </div>

      <MaintenanceFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setMaintenanceEdit(null); setEquipementSelectionne(null); }}
        onSuccess={charger}
        maintenance={maintenanceEdit}
        equipementInitial={equipementSelectionne}
      />

      <Modal open={!!suppression} onClose={() => setSuppression(null)} title="Supprimer la maintenance" size="sm"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={() => setSuppression(null)}>Annuler</Button>
            <Button variant="danger" onClick={handleSupprimer} loading={deleting} icon={<Trash2 size={16} />}>Supprimer</Button>
          </div>
        }
      >
        <p className="text-sm text-ink-soft">
          Voulez-vous vraiment supprimer la maintenance du <strong>{suppression ? formatDate(suppression.date) : ''}</strong> ?
        </p>
      </Modal>
    </AppShell>
  );
}

// Composant réutilisable pour les statistiques
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-card border border-line rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-ink-soft">{label}</p>
        <p className="text-2xl font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}