import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Search, CheckCircle2, Clock, XCircle, Plus,
  User, Calendar, HardDrive,
} from 'lucide-react';
import { contratsApi } from '../../../api/securitrack';
import type { Contrat, EtatContrat } from '../../../types/securitrack';
import AppShell from '../../../components/layout/AppShell';
import Input from '../../../components/ui/input';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import { EtatContratBadge } from '../../../components/securitrack/badges';
import ContratFormModal from '../../../components/securitrack/ContratFormModal';
import { useToast } from '../../../context/ToastContext';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR');
}

function joursRestants(dateFin: string) {
  const diff = new Date(dateFin).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function ContratsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreEtat, setFiltreEtat] = useState<'' | EtatContrat>('');
  const [modalOpen, setModalOpen] = useState(false);

  const charger = () => {
    setLoading(true);
    contratsApi.list()
      .then(setContrats)
      .catch(() => toast.error('Erreur', 'Impossible de charger les contrats.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stats
  const stats = useMemo(() => ({
    total: contrats.length,
    actifs: contrats.filter(c => c.etat === 'ACTIF').length,
    bientot: contrats.filter(c => c.etat === 'BIENTOT_EXPIRE').length,
    expires: contrats.filter(c => c.etat === 'EXPIRE').length,
  }), [contrats]);

  // Filtre + recherche + tri
  const affiches = useMemo(() => {
    let liste = [...contrats].sort((a, b) => {
      // Bientôt expirés en premier, puis actifs, puis expirés
      const ordre: Record<EtatContrat, number> = { BIENTOT_EXPIRE: 0, ACTIF: 1, EXPIRE: 2 };
      const diff = ordre[a.etat] - ordre[b.etat];
      if (diff !== 0) return diff;
      return new Date(a.date_fin).getTime() - new Date(b.date_fin).getTime();
    });

    if (filtreEtat) liste = liste.filter(c => c.etat === filtreEtat);

    if (recherche.trim()) {
      const q = recherche.toLowerCase();
      liste = liste.filter(c =>
        c.client_nom.toLowerCase().includes(q) ||
        c.equipements_detail.some(e => e.model.toLowerCase().includes(q))
      );
    }

    return liste;
  }, [contrats, filtreEtat, recherche]);

  const etatsDispo: { value: '' | EtatContrat; label: string; count: number }[] = [
    { value: '', label: 'Tous', count: stats.total },
    { value: 'ACTIF', label: 'Actifs', count: stats.actifs },
    { value: 'BIENTOT_EXPIRE', label: 'Bientôt expirés', count: stats.bientot },
    { value: 'EXPIRE', label: 'Expirés', count: stats.expires },
  ];

  return (
    <AppShell
      title="Contrats"
      breadcrumb={['NjCam', 'SecuriTrack', 'Contrats']}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary-soft text-primary"><FileText size={18} /></div>
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
            <div className="p-2 rounded-md bg-warning-soft text-warning"><Clock size={18} /></div>
            <div>
              <p className="text-xs text-ink-soft">Bientôt expirés</p>
              <p className="text-xl font-semibold text-ink">{stats.bientot}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-danger-soft text-danger"><XCircle size={18} /></div>
            <div>
              <p className="text-xs text-ink-soft">Expirés</p>
              <p className="text-xl font-semibold text-ink">{stats.expires}</p>
            </div>
          </div>
        </div>

        {/* Filtres + Bouton */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="border-b border-line flex-1 min-w-0">
            <div className="flex items-center gap-1 -mb-px overflow-x-auto">
              {etatsDispo.map((e) => (
                <button
                  key={e.value || 'tous'}
                  onClick={() => setFiltreEtat(e.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    filtreEtat === e.value
                      ? 'border-primary text-primary'
                      : 'border-transparent text-ink-soft hover:text-ink'
                  }`}
                >
                  {e.label}
                  {e.count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-ink-soft">
                      {e.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <Button icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>
            Nouveau contrat
          </Button>
        </div>

        {/* Recherche */}
        {contrats.length > 0 && (
          <Input
            placeholder="Rechercher par client ou équipement…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            icon={<Search size={15} />}
          />
        )}

        {/* Liste */}
        {loading ? (
          <div className="bg-card border border-line rounded-lg p-12 text-center text-sm text-ink-soft">
            Chargement des contrats…
          </div>
        ) : contrats.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<FileText size={24} />}
              title="Aucun contrat"
              description="Créez votre premier contrat pour lier un client à ses équipements."
              action={
                <Button icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>
                  Créer un contrat
                </Button>
              }
            />
          </div>
        ) : affiches.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Search size={24} />}
              title="Aucun résultat"
              description={
                recherche.trim()
                  ? `Aucun résultat pour "${recherche}".`
                  : 'Aucun contrat dans ce filtre.'
              }
              action={
                (recherche.trim() || filtreEtat) ? (
                  <Button
                    variant="secondary"
                    onClick={() => { setRecherche(''); setFiltreEtat(''); }}
                  >
                    Réinitialiser les filtres
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="space-y-2">
            {affiches.map((c) => {
              const jours = joursRestants(c.date_fin);
              return (
                <div
                  key={c.id}
                  className="bg-card border border-line rounded-lg p-4 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => navigate(`/securitrack/admin/contrats/${c.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-mono text-xs font-medium text-ink-soft">
                          CTR-{String(c.id).padStart(5, '0')}
                        </span>
                      </div>

                      {/* Client */}
                      <p className="text-sm font-medium text-ink mb-1 flex items-center gap-1.5">
                        <User size={13} className="text-primary" />
                        {c.client_nom}
                      </p>

                      {/* Méta */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDate(c.date_debut)} → {formatDate(c.date_fin)}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive size={11} />
                          {c.equipements_detail.length} équipement{c.equipements_detail.length > 1 ? 's' : ''}
                        </span>
                        {c.etat === 'BIENTOT_EXPIRE' && (
                          <span className="text-warning font-medium">
                            Expire dans {jours} j
                          </span>
                        )}
                        {c.etat === 'EXPIRE' && (
                          <span className="text-danger font-medium">
                            Expiré depuis {Math.abs(jours)} j
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badge état */}
                    <div className="shrink-0">
                      <EtatContratBadge etat={c.etat} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale création */}
      <ContratFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={charger}
      />
    </AppShell>
  );
}