import { useNavigate } from 'react-router-dom';
import { Camera, Ticket, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/layout/AppShell';

interface ModuleCard {
  id: 'camtrack' | 'smart-ticket' | 'securitrack';
  label: string;
  description: string;
  icon: typeof Camera;
  color: string;
  bgColor: string;
  actif: boolean;
}

const MODULES: ModuleCard[] = [
  {
    id: 'camtrack',
    label: 'CamTrack',
    description:
      "Gérez les installations de vidéosurveillance : demandes, études de sites, devis, installations et rapports.",
    icon: Camera,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    actif: true,
  },
  {
    id: 'smart-ticket',
    label: 'Smart Ticket',
    description:
      "Gérez les incidents techniques : tickets, affectation des techniciens, interventions, diagnostics et rapports.",
    icon: Ticket,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    actif: true,
  },
  {
    id: 'securitrack',
    label: 'SecuriTrack',
    description:
      "Assurez le suivi, la sécurité et la maintenance : contrats, équipements, maintenance préventive et alertes.",
    icon: Shield,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    actif: true, // ✅ ACTIVÉ
  },
];

/**
 * Source unique de vérité pour l'écran d'accueil d'un module selon le rôle.
 * Même logique que ModuleSwitcher — on garde les deux synchronisés.
 */
function getDefaultPath(moduleId: ModuleCard['id'], role: string): string {
  if (moduleId === 'camtrack') {
    if (role === 'CLIENT') return '/camtrack/client/offres';
    if (role === 'ADMIN') return '/camtrack/admin/demandes';
    return '/camtrack/technicien/etudes';
  }
  if (moduleId === 'smart-ticket') {
    if (role === 'CLIENT') return '/smart-ticket/client/tickets';
    if (role === 'ADMIN') return '/smart-ticket/admin/tickets';
    return '/smart-ticket/technicien/tickets';
  }
  // SecuriTrack
  if (role === 'ADMIN') return '/securitrack/admin/dashboard';
  if (role === 'TECHNICIEN') return '/securitrack/technicien/maintenances';
  return '/securitrack/client/contrats';
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) return null;

  const handleModuleClick = (mod: ModuleCard) => {
    if (!mod.actif) return;
    const path = getDefaultPath(mod.id, user.role);
    navigate(path);
  };

  return (
    <AppShell title="Tableau de bord" breadcrumb={['NjCam', 'Accueil']}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* En-tête */}
        <div>
          <h1 className="text-2xl font-semibold text-ink mb-1">
            Bonjour {user.first_name} 👋
          </h1>
          <p className="text-sm text-ink-soft">
            Choisissez un module pour commencer.
          </p>
        </div>

        {/* Cartes modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => handleModuleClick(mod)}
                disabled={!mod.actif}
                className={`
                  text-left bg-card border border-line rounded-lg p-5 transition-all
                  ${mod.actif ? 'hover:border-primary/40 hover:shadow-md cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                `}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2.5 rounded-md ${mod.bgColor}`}>
                    <Icon size={20} className={mod.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-ink">{mod.label}</h3>
                      {!mod.actif && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface text-ink-faint font-medium">
                          BIENTÔT
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-ink-soft mb-4 line-clamp-3">
                  {mod.description}
                </p>

                {mod.actif && (
                  <div className="flex items-center gap-1.5 text-primary text-sm font-medium">
                    Ouvrir <ArrowRight size={14} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Info */}
        <div className="bg-surface border border-line rounded-lg p-5">
          <p className="text-sm text-ink-soft">
            💡 <strong>Astuce</strong> : Utilisez le sélecteur de module en haut de la barre latérale
            pour passer rapidement d'un module à l'autre.
          </p>
        </div>
      </div>
    </AppShell>
  );
}