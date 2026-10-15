import { useEffect, useMemo, useState } from 'react';
import {
  Shield, Search, AlertTriangle, CheckCircle2, Clock,
  Camera, HardDrive, Calendar, User, MapPin, Filter,
} from 'lucide-react';
import { getEquipementsGarantie } from '../../../api/camtrackService';
import type { Equipement, StatutEquipement, TypeEquipement } from '../../../types/camtrack';
import AppShell from '../../../components/layout/AppShell';
import Input from '../../../components/ui/input';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import { useToast } from '../../../context/ToastContext';

type Filtre = 'tous' | 'expirees' | 'bientot' | 'actives';

const TYPE_LABELS: Record<TypeEquipement, string> = {
  CAMERA: 'Caméra',
  NVR_DVR: 'NVR/DVR',
};

const STATUT_CONFIG: Record<
  StatutEquipement,
  { label: string; variant: 'success' | 'warning' | 'danger' }
> = {
  ACTIF: { label: 'Actif', variant: 'success' },
  EN_PANNE: { label: 'En panne', variant: 'warning' },
  HORS_SERVICE: { label: 'Hors service', variant: 'danger' },
};

export default function GarantiesAdminPage() {
  const toast = useToast();

  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState<Filtre>('tous');

  useEffect(() => {
    getEquipementsGarantie()
      .then(setEquipements)
      .catch(() => toast.error('Erreur', 'Impossible de charger les équipements.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stats
  const stats = useMemo(() => {
    const total = equipements.length;
    const expirees = equipements.filter((e) => e.garantie_expiree).length;
    const bientot = equipements.filter(
      (e) => !e.garantie_expiree && e.garantie_jours_restants <= 30
    ).length;
    const actives = total - expirees;
    return { total, expirees, bientot, actives };
  }, [equipements]);

  // Filtre
  const equipementsFiltres = useMemo(() => {
    let base = equipements;

    if (filtre === 'expirees') base = base.filter((e) => e.garantie_expiree);
    else if (filtre === 'bientot')
      base = base.filter(
        (e) => !e.garantie_expiree && e.garantie_jours_restants <= 30
      );
    else if (filtre === 'actives')
      base = base.filter((e) => !e.garantie_expiree);

    if (recherche.trim()) {
      const q = recherche.toLowerCase();
      base = base.filter(
        (e) =>
          e.model.toLowerCase().includes(q) ||
          e.site_nom.toLowerCase().includes(q) ||
          e.client_nom.toLowerCase().includes(q) ||
          (e.adresse_ip && e.adresse_ip.includes(q))
      );
    }

    return [...base].sort((a, b) => {
      // Trier par urgence : expirées d'abord, puis bientôt, puis actives
      const order = (e: Equipement) => {
        if (e.garantie_expiree) return 0;
        if (e.garantie_jours_restants <= 30) return 1;
        return 2;
      };
      const diff = order(a) - order(b);
      if (diff !== 0) return diff;
      return a.garantie_jours_restants - b.garantie_jours_restants;
    });
  }, [equipements, filtre, recherche]);

  // Helper : couleur du badge de jours restants
  const renderGarantie = (e: Equipement) => {
    if (e.garantie_expiree) {
      return (
        <Badge variant="danger" dot>
          <AlertTriangle size={11} /> Expirée
        </Badge>
      );
    }
    const jours = e.garantie_jours_restants;
    if (jours <= 7) {
      return (
        <Badge variant="danger" dot>
          <Clock size={11} /> Expire dans {jours} j
        </Badge>
      );
    }
    if (jours <= 30) {
      return (
        <Badge variant="warning" dot>
          <Clock size={11} /> {jours} jours restants
        </Badge>
      );
    }
    if (jours <= 90) {
      return (
        <Badge variant="info" dot>
          <Clock size={11} /> {jours} jours restants
        </Badge>
      );
    }
    return (
      <Badge variant="success" dot>
        <CheckCircle2 size={11} /> {jours} jours restants
      </Badge>
    );
  };

  const filtres: { id: Filtre; label: string; count: number }[] = [
    { id: 'tous', label: 'Tous', count: stats.total },
    { id: 'expirees', label: 'Expirées', count: stats.expirees },
    { id: 'bientot', label: 'Bientôt (30j)', count: stats.bientot },
    { id: 'actives', label: 'Actives', count: stats.actives },
  ];

  return (
    <AppShell
      title="Suivi des garanties"
      breadcrumb={['NjCam', 'CamTrack', 'Garanties']}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary-soft text-primary">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">Total équipements</p>
              <p className="text-xl font-semibold text-ink">{stats.total}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-success-soft text-success">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">Sous garantie</p>
              <p className="text-xl font-semibold text-ink">{stats.actives}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-warning-soft text-warning">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">Expirent bientôt</p>
              <p className="text-xl font-semibold text-ink">{stats.bientot}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-danger-soft text-danger">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">Expirées</p>
              <p className="text-xl font-semibold text-ink">{stats.expirees}</p>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="border-b border-line">
          <div className="flex items-center gap-1 -mb-px overflow-x-auto">
            {filtres.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltre(f.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  filtre === f.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-ink-soft hover:text-ink'
                }`}
              >
                {f.label}
                {f.count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-ink-soft">
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Recherche */}
        {equipements.length > 0 && (
          <Input
            placeholder="Rechercher par modèle, site, client ou IP…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            icon={<Search size={15} />}
          />
        )}

        {/* Liste */}
        {loading ? (
          <div className="bg-card border border-line rounded-lg p-12 text-center text-sm text-ink-soft">
            Chargement des équipements…
          </div>
        ) : equipements.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Shield size={24} />}
              title="Aucun équipement"
              description="Aucun équipement n'a encore été installé. Les garanties apparaîtront ici après les installations."
            />
          </div>
        ) : equipementsFiltres.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Filter size={24} />}
              title="Aucun résultat"
              description={
                recherche.trim()
                  ? `Aucun résultat pour "${recherche}".`
                  : `Aucun équipement dans la catégorie "${filtres.find((f) => f.id === filtre)?.label}".`
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
            {equipementsFiltres.map((e) => (
              <div
                key={e.id}
                className="bg-card border border-line rounded-lg p-4 hover:border-primary/40 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Icône */}
                    <div
                      className={`p-2 rounded-md shrink-0 ${
                        e.type_equipement === 'CAMERA'
                          ? 'bg-primary-soft text-primary'
                          : 'bg-info-soft text-info'
                      }`}
                    >
                      {e.type_equipement === 'CAMERA' ? (
                        <Camera size={18} />
                      ) : (
                        <HardDrive size={18} />
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-medium text-ink">
                          {e.model}
                        </p>
                        <Badge variant="neutral" size="sm">
                          {TYPE_LABELS[e.type_equipement]}
                        </Badge>
                        <Badge
                          variant={STATUT_CONFIG[e.statut].variant}
                          size="sm"
                          dot
                        >
                          {STATUT_CONFIG[e.statut].label}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft mt-2">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} /> {e.site_nom}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={11} /> {e.client_nom}
                        </span>
                        {e.adresse_ip && (
                          <span className="font-mono text-ink-soft">
                            IP : {e.adresse_ip}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(e.date_debut_garantie).toLocaleDateString('fr-FR')} →{' '}
                          {new Date(e.date_fin_garantie).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badge garantie */}
                  <div className="shrink-0">{renderGarantie(e)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}