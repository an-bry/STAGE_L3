import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, FileText, Search, ArrowRight, Camera,
  Clock, CheckCircle2, XCircle,
} from 'lucide-react';
import { getMesDemandes } from '../../../api/camtrackService';
import type { DemandeClient, StatutDemande } from '../../../types/camtrack';
import AppShell from '../../../components/layout/AppShell';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/input';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import { useToast } from '../../../context/ToastContext';

const STATUT_CONFIG: Record<
  StatutDemande,
  { label: string; variant: 'warning' | 'success' | 'danger'; icon: typeof Clock }
> = {
  EN_ATTENTE: { label: 'En attente', variant: 'warning', icon: Clock },
  VALIDEE: { label: 'Validée', variant: 'success', icon: CheckCircle2 },
  REJETEE: { label: 'Rejetée', variant: 'danger', icon: XCircle },
};

export default function DemandesPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [demandes, setDemandes] = useState<DemandeClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    getMesDemandes()
      .then(setDemandes)
      .catch(() => toast.error('Erreur', 'Impossible de charger vos demandes.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const demandesFiltrees = useMemo(() => {
    const base = [...demandes].sort((a, b) => b.id - a.id);
    if (!recherche.trim()) return base;
    const q = recherche.toLowerCase();
    return base.filter(
      (d) =>
        String(d.id).includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.offre.nom.toLowerCase().includes(q)
    );
  }, [demandes, recherche]);

  const stats = useMemo(
    () => ({
      total: demandes.length,
      enAttente: demandes.filter((d) => d.statut === 'EN_ATTENTE').length,
      validees: demandes.filter((d) => d.statut === 'VALIDEE').length,
    }),
    [demandes]
  );

  return (
    <AppShell
      title="Mes demandes"
      breadcrumb={['NjCam', 'CamTrack', 'Mes demandes']}
      actions={
        <Button
          icon={<Plus size={16} />}
          onClick={() => navigate('/camtrack/client/offres')}
        >
          Nouvelle demande
        </Button>
      }
    >
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
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
        </div>

        {/* Recherche */}
        {demandes.length > 0 && (
          <Input
            placeholder="Rechercher par numéro, offre ou description…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            icon={<Search size={15} />}
          />
        )}

        {/* Liste */}
        {loading ? (
          <div className="bg-card border border-line rounded-lg p-12 text-center text-sm text-ink-soft">
            Chargement de vos demandes…
          </div>
        ) : demandes.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Camera size={24} />}
              title="Aucune demande pour l'instant"
              description="Parcourez notre catalogue et demandez une installation de vidéosurveillance."
              action={
                <Button
                  icon={<Plus size={16} />}
                  onClick={() => navigate('/camtrack/client/offres')}
                >
                  Voir le catalogue
                </Button>
              }
            />
          </div>
        ) : demandesFiltrees.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Search size={24} />}
              title="Aucun résultat"
              description={`Aucune demande ne correspond à "${recherche}".`}
              action={
                <Button variant="secondary" onClick={() => setRecherche('')}>
                  Effacer la recherche
                </Button>
              }
            />
          </div>
        ) : (
          <div className="space-y-2">
            {demandesFiltrees.map((demande) => {
              const conf = STATUT_CONFIG[demande.statut];
              const StatutIcon = conf.icon;
              return (
                <button
                  key={demande.id}
                  onClick={() => navigate(`/camtrack/client/demandes/${demande.id}`)}
                  className="w-full text-left bg-card border border-line rounded-lg p-4 hover:border-primary/40 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-xs font-medium text-ink-soft">
                          DEM-{String(demande.id).padStart(5, '0')}
                        </span>
                        <span className="text-xs text-ink-faint">•</span>
                        <span className="text-xs text-ink-soft">
                          {new Date(demande.date_soumission).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-ink mb-1">
                        {demande.offre.nom}
                      </p>
                      <p className="text-sm text-ink-soft line-clamp-2">
                        {demande.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant={conf.variant} dot>
                        <StatutIcon size={11} /> {conf.label}
                      </Badge>
                      {demande.devis && (
                        <Badge variant="info" size="sm">
                          Devis : {demande.devis.montant.toLocaleString('fr-FR')} Ar
                        </Badge>
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