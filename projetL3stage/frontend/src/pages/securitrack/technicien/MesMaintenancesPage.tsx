import { useEffect, useMemo, useState } from 'react';
import {
  Wrench, Search, Calendar, CheckCircle2, Clock, AlertTriangle,
  Play, Check,  HardDrive, MapPin,
} from 'lucide-react';
import { maintenancesApi } from '../../../api/securitrack';
import type { Maintenance } from '../../../types/securitrack';
import AppShell from '../../../components/layout/AppShell';
import Input from '../../../components/ui/input';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import Textarea from '../../../components/ui/Texterea';
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

  // Démarrer
  const [demarrer, setDemarrer] = useState<Maintenance | null>(null);
  const [demarrant, setDemarrant] = useState(false);

  // Terminer
  const [terminer, setTerminer] = useState<Maintenance | null>(null);
  const [compteRendu, setCompteRendu] = useState('');
  const [terminant, setTerminant] = useState(false);

  const charger = () => {
    setLoading(true);
    maintenancesApi.mesMaintenances()
      .then(setMaintenances)
      .catch(() => toast.error('Erreur', 'Impossible de charger vos maintenances.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    return maintenances.filter(m => m.statut === 'TERMINEE');
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
      m.site_nom.toLowerCase().includes(q) ||
      m.client_nom.toLowerCase().includes(q)
    );
  }, [parTab, recherche]);

  const handleDemarrer = async () => {
    if (!demarrer) return;
    setDemarrant(true);
    try {
      await maintenancesApi.demarrer(demarrer.id);
      toast.success('Maintenance démarrée', 'Vous pouvez maintenant travailler.');
      setDemarrer(null);
      charger();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || 'Impossible de démarrer.');
    } finally {
      setDemarrant(false);
    }
  };

  const handleTerminer = async () => {
    if (!terminer) return;
    if (compteRendu.trim().length < 10) {
      toast.error('Compte rendu trop court', 'Minimum 10 caractères.');
      return;
    }
    setTerminant(true);
    try {
      await maintenancesApi.terminer(terminer.id, compteRendu.trim());
      toast.success('Maintenance terminée', 'Le client a été notifié.');
      setTerminer(null);
      setCompteRendu('');
      charger();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || 'Impossible de terminer.');
    } finally {
      setTerminant(false);
    }
  };

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'toutes', label: 'Toutes', count: stats.total },
    { id: 'planifiees', label: 'À démarrer', count: stats.planifiees },
    { id: 'en_cours', label: 'En cours', count: stats.enCours },
    { id: 'terminees', label: 'Terminées', count: stats.terminees },
  ];

  return (
    <AppShell
      title="Mes maintenances"
      breadcrumb={['NjCam', 'SecuriTrack', 'Mes maintenances']}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* Bandeau en retard */}
        {stats.enRetard > 0 && (
          <div className="bg-danger-soft border border-danger/20 rounded-lg p-3 flex items-center gap-3">
            <AlertTriangle size={16} className="text-danger shrink-0" />
            <p className="text-sm text-danger flex-1">
              <strong>{stats.enRetard}</strong> maintenance{stats.enRetard > 1 ? 's' : ''} en retard.
            </p>
            <button
              onClick={() => setActiveTab('planifiees')}
              className="text-xs text-danger hover:underline"
            >
              Voir
            </button>
          </div>
        )}

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
              <p className="text-xs text-ink-soft">À démarrer</p>
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

        {/* Recherche */}
        {maintenances.length > 0 && (
          <Input
            placeholder="Rechercher par équipement, site ou client…"
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
              description="Aucune maintenance ne vous est affectée pour le moment."
            />
          </div>
        ) : affichees.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Search size={24} />}
              title="Aucun résultat"
              description={`Rien dans l'onglet "${tabs.find(t => t.id === activeTab)?.label}".`}
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
                    : 'border-line'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
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
                      <span className="text-ink-faint">• {m.client_nom}</span>
                    </div>

                    {m.statut === 'TERMINEE' && m.compte_rendu && (
                      <p className="text-xs text-ink-soft mt-2 line-clamp-2 italic">
                        « {m.compte_rendu} »
                      </p>
                    )}
                  </div>

                  {/* Badge + actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatutMaintenanceBadge statut={m.statut} />

                    {m.statut === 'PLANIFIEE' && (
                      <Button
                        icon={<Play size={13} />}
                        onClick={() => setDemarrer(m)}
                      >
                        Démarrer
                      </Button>
                    )}
                    {m.statut === 'EN_COURS' && (
                      <Button
                        variant="success"
                        icon={<Check size={13} />}
                        onClick={() => { setTerminer(m); setCompteRendu(''); }}
                      >
                        Terminer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal démarrer */}
      <Modal
        open={!!demarrer}
        onClose={() => setDemarrer(null)}
        title="Démarrer la maintenance"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDemarrer(null)}>Annuler</Button>
            <Button onClick={handleDemarrer} loading={demarrant} icon={<Play size={15} />}>
              Démarrer
            </Button>
          </>
        }
      >
        {demarrer && (
          <p className="text-sm text-ink-soft">
            Confirmez le démarrage de la maintenance sur{' '}
            <strong>{demarrer.equipement_detail.model}</strong> ({demarrer.site_nom}) ?
          </p>
        )}
      </Modal>

      {/* Modal terminer */}
      <Modal
        open={!!terminer}
        onClose={() => setTerminer(null)}
        title="Terminer la maintenance"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTerminer(null)}>Annuler</Button>
            <Button
              variant="success"
              onClick={handleTerminer}
              loading={terminant}
              disabled={compteRendu.trim().length < 10}
              icon={<Check size={15} />}
            >
              Terminer
            </Button>
          </>
        }
      >
        {terminer && (
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">
              Maintenance sur <strong>{terminer.equipement_detail.model}</strong>{' '}
              ({terminer.site_nom}).
            </p>
            <Textarea
              label="Compte rendu"
              value={compteRendu}
              onChange={(e) => setCompteRendu(e.target.value)}
              rows={4}
              placeholder="Décrivez ce qui a été fait, l'état de l'équipement, les pièces remplacées…"
              hint={`${compteRendu.length} / 1000 · minimum 10 caractères`}
            />
            <div className="bg-info-soft border border-info/30 rounded-md p-3 text-xs text-info flex items-start gap-2">
              <Check size={14} className="shrink-0 mt-0.5" />
              <span>Le client sera notifié de la fin de l'intervention.</span>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}