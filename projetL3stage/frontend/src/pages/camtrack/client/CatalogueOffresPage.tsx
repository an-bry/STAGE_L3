import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Check, ArrowRight, Package, Shield, Clock,
} from 'lucide-react';
import { getOffres } from '../../../api/camtrackService';
import type { Offre } from '../../../types/camtrack';
import AppShell from '../../../components/layout/AppShell';
import EmptyState from '../../../components/ui/EmptyState';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../context/ToastContext';

function formatAriary(value: number): string {
  return `${value.toLocaleString('fr-FR')} Ar`;
}

export default function CatalogueOffresPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [offres, setOffres] = useState<Offre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOffres()
      .then(setOffres)
      .catch(() => toast.error('Erreur', 'Impossible de charger les offres.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell
      title="Catalogue des offres"
      breadcrumb={['NjCam', 'CamTrack', 'Catalogue']}
      actions={
        <Button
          variant="secondary"
          icon={<Package size={15} />}
          onClick={() => navigate('/camtrack/client/demandes')}
        >
          Mes demandes
        </Button>
      }
    >
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* En-tête */}
        <div>
          <h1 className="text-2xl font-semibold text-ink mb-1">
            Nos offres de vidéosurveillance
          </h1>
          <p className="text-sm text-ink-soft">
            Choisissez l'offre qui correspond à vos besoins. Notre équipe vous accompagne
            de l'étude à l'installation.
          </p>
        </div>

        {/* Liste des offres */}
        {loading ? (
          <div className="bg-card border border-line rounded-lg p-12 text-center text-sm text-ink-soft">
            Chargement des offres…
          </div>
        ) : offres.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Package size={24} />}
              title="Aucune offre disponible"
              description="Aucune offre n'est disponible pour le moment. Revenez plus tard."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {offres.map((offre) => (
              <div
                key={offre.id}
                className="bg-card border border-line rounded-lg p-6 flex flex-col hover:border-primary/40 hover:shadow-md transition-all"
              >
                {/* Icône + nom */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2.5 rounded-md bg-primary-soft">
                    <Camera size={22} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-ink">{offre.nom}</h3>
                  </div>
                </div>

                {/* Description */}
                {offre.description && (
                  <p className="text-sm text-ink-soft mb-5 min-h-[3rem]">
                    {offre.description}
                  </p>
                )}

                {/* Caractéristiques */}
                <ul className="space-y-2.5 mb-5 flex-1">
                  <li className="flex items-center gap-2 text-sm text-ink">
                    <Check size={16} className="text-success shrink-0" />
                    <span>
                      <strong>{offre.nombre_cameras_inclus}</strong> caméra
                      {offre.nombre_cameras_inclus > 1 ? 's' : ''} incluses
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-ink">
                    <Check size={16} className="text-success shrink-0" />
                    <span>
                      Engagement <strong>{offre.duree_engagement_mois} mois</strong>
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-ink">
                    <Shield size={16} className="text-success shrink-0" />
                    <span>Installation + maintenance incluses</span>
                  </li>
                </ul>

                {/* Prix */}
                <div className="border-t border-line pt-4 mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-ink">
                      {formatAriary(offre.prix_abonnement)}
                    </span>
                    <span className="text-sm text-ink-soft">/ mois</span>
                  </div>
                </div>

                {/* CTA */}
                <Button
                  fullWidth
                  icon={<ArrowRight size={15} />}
                  onClick={() =>
                    navigate(`/camtrack/client/demandes/nouvelle?offre=${offre.id}`)
                  }
                >
                  Demander cette offre
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Info bas de page */}
        <div className="bg-surface border border-line rounded-lg p-5 flex items-start gap-3">
          <Clock size={18} className="text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-ink-soft">
            <p className="font-medium text-ink mb-1">Comment ça marche ?</p>
            <p>
              1. Choisissez une offre → 2. Remplissez le formulaire → 3. Un technicien étudie votre site
              → 4. recevez un devis → 5. Installation planifiée.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}