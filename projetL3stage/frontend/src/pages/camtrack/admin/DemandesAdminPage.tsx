import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, FileText, Clock, CheckCircle2, XCircle,
  ArrowRight,  Camera, Package,
} from 'lucide-react';
import { getToutesLesDemandes } from '../../../api/camtrackService';
import type { DemandeAdmin, StatutDemande } from '../../../types/camtrack';
import AppShell from '../../../components/layout/AppShell';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/input';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import UserAvatar from '../../../components/ui/UserAvatar';
import { useToast } from '../../../context/ToastContext';

type TabId = 'toutes' | 'en_attente' | 'validees' | 'rejetees';

const STATUT_CONFIG: Record<
  StatutDemande,
  { label: string; variant: 'warning' | 'success' | 'danger'; icon: typeof Clock }
> = {
  EN_ATTENTE: { label: 'En attente', variant: 'warning', icon: Clock },
  VALIDEE: { label: 'Validée', variant: 'success', icon: CheckCircle2 },
  REJETEE: { label: 'Rejetée', variant: 'danger', icon: XCircle },
};

export default function DemandesAdminPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [demandes, setDemandes] = useState<DemandeAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('toutes');

  useEffect(() => {
    getToutesLesDemandes()
      .then(setDemandes)
      .catch(() => toast.error('Erreur', 'Impossible de charger les demandes.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stats
  const stats = useMemo(
    () => ({
      total: demandes.length,
      enAttente: demandes.filter((d) => d.statut === 'EN_ATTENTE').length,
      validees: demandes.filter((d) => d.statut === 'VALIDEE').length,
      rejetees: demandes.filter((d) => d.statut === 'REJETEE').length,
    }),
    [demandes]
  );

  // Filtre par onglet
  const demandesParTab = useMemo(() => {
    if (activeTab === 'toutes') return demandes;
    if (activeTab === 'en_attente')
      return demandes.filter((d) => d.statut === 'EN_ATTENTE');
    if (activeTab === 'validees')
      return demandes.filter((d) => d.statut === 'VALIDEE');
    return demandes.filter((d) => d.statut === 'REJETEE');
  }, [demandes, activeTab]);

  // Recherche + tri par id desc
  const demandesAffichees = useMemo(() => {
    const tri = [...demandesParTab].sort((a, b) => b.id - a.id);
    if (!recherche.trim()) return tri;
    const q = recherche.toLowerCase();
    return tri.filter(
      (d) =>
        String(d.id).includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.client.username.toLowerCase().includes(q) ||
        d.offre.nom.toLowerCase().includes(q) ||
        d.sites.some((s) => s.nom.toLowerCase().includes(q))
    );
  }, [demandesParTab, recherche]);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'toutes', label: 'Toutes', count: stats.total },
    { id: 'en_attente', label: 'En attente', count: stats.enAttente },
    { id: 'validees', label: 'Validées', count: stats.validees },
    { id: 'rejetees', label: 'Rejetées', count: stats.rejetees },
  ];

  return (
    <AppShell
      title="Demandes d'installation"
      breadcrumb={['NjCam', 'CamTrack', 'Demandes']}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary-soft text-primary">
              <FileText size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">Total</p>
              <p className="text-xl font-semibold text-ink">{stats.total}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-warning-soft text-warning">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">En attente</p>
              <p className="text-xl font-semibold text-ink">{stats.enAttente}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-success-soft text-success">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">Validées</p>
              <p className="text-xl font-semibold text-ink">{stats.validees}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-danger-soft text-danger">
              <XCircle size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">Rejetées</p>
              <p className="text-xl font-semibold text-ink">{stats.rejetees}</p>
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
        {demandes.length > 0 && (
          <Input
            placeholder="Rechercher par client, offre, description ou n° de demande…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            icon={<Search size={15} />}
          />
        )}

        {/* Liste */}
        {loading ? (
          <div className="bg-card border border-line rounded-lg p-12 text-center text-sm text-ink-soft">
            Chargement des demandes…
          </div>
        ) : demandes.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<FileText size={24} />}
              title="Aucune demande"
              description="Aucune demande d'installation n'a encore été soumise."
            />
          </div>
        ) : demandesAffichees.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Search size={24} />}
              title="Aucun résultat"
              description={
                recherche.trim()
                  ? `Aucun résultat pour "${recherche}".`
                  : `Aucune demande dans l'onglet "${tabs.find((t) => t.id === activeTab)?.label}".`
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
            {demandesAffichees.map((demande) => {
              const conf = STATUT_CONFIG[demande.statut];
              const StatutIcon = conf.icon;
              const premierSite = demande.sites[0];

              return (
                <button
                  key={demande.id}
                  onClick={() => navigate(`/camtrack/admin/demandes/${demande.id}`)}
                  className="w-full text-left bg-card border border-line rounded-lg p-4 hover:border-primary/40 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-mono text-xs font-medium text-ink-soft">
                          DEM-{String(demande.id).padStart(5, '0')}
                        </span>
                        <span className="text-xs text-ink-faint">•</span>
                        <span className="text-xs text-ink-soft">
                          {new Date(demande.date_soumission).toLocaleDateString('fr-FR')}
                        </span>
                      </div>

                      {/* Client */}
                      <div className="flex items-center gap-2 mb-2">
                        <UserAvatar
                          firstName={demande.client.first_name}
                          lastName={demande.client.last_name}
                          size="sm"
                        />
                        <span className="text-sm font-medium text-ink">
                          {demande.client.first_name} {demande.client.last_name}
                        </span>
                        {demande.client.telephone && (
                          <>
                            <span className="text-xs text-ink-faint">•</span>
                            <span className="text-xs text-ink-soft">
                              {demande.client.telephone}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Offre */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <Package size={13} className="text-primary shrink-0" />
                        <span className="text-xs text-ink">
                          <strong>{demande.offre.nom}</strong> — {demande.offre.nombre_cameras_inclus} caméras
                        </span>
                      </div>

                      {/* Site */}
                      {premierSite && (
                        <div className="flex items-center gap-2">
                          <Camera size={13} className="text-ink-soft shrink-0" />
                          <span className="text-xs text-ink-soft truncate">
                            {premierSite.nom} — {premierSite.adresse}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant={conf.variant} dot>
                        <StatutIcon size={11} /> {conf.label}
                      </Badge>
                      {demande.devis ? (
                        <Badge variant="info" size="sm">
                          Devis : {demande.devis.montant.toLocaleString('fr-FR')} Ar
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-ink-faint italic">
                          Pas de devis
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