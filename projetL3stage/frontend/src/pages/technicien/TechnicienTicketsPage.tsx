import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, Search,  ArrowRight,
  CheckCircle2, History, ClipboardList, 
} from 'lucide-react';
import { getMesAffectations } from '../../api/ticketService';
import type { TicketTechnicien, TicketStatut } from '../../types/ticket';
import { formatDate, formatReference } from '../../utils/ticketDisplay';
import AppShell from '../../components/layout/AppShell';
import Input from '../../components/ui/input';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import Tabs, { type TabItem } from '../../components/ui/Tabs';
import { StatusBadge } from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import UserAvatar from '../../components/ui/UserAvatar';
import { useToast } from '../../context/ToastContext';

type TabId = 'diagnostics' | 'interventions' | 'historique';

// ============================================
// MAPPING DES STATUTS
// ============================================
const STATUTS_DIAGNOSTICS: TicketStatut[] = ['AFFECTE', 'A_QUALIFIER', 'EN_ATTENTE'];
const STATUTS_INTERVENTIONS: TicketStatut[] = ['EN_COURS'];
const STATUTS_HISTORIQUE: TicketStatut[] = ['RESOLU', 'CLOTURE'];

// ============================================
// BADGES CONTEXTUELS
// ============================================
function getActionBadge(statut: TicketStatut) {
  switch (statut) {
    case 'AFFECTE':
      return <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-soft text-primary font-medium">À diagnostiquer</span>;
    case 'A_QUALIFIER':
      return <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning-soft text-warning font-medium">En attente devis Admin</span>;
    case 'EN_ATTENTE':
      return <span className="text-[10px] px-1.5 py-0.5 rounded bg-info-soft text-info font-medium">En attente client</span>;
    case 'EN_COURS':
      return <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning-soft text-warning font-medium">À réparer</span>;
    case 'RESOLU':
      return <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-soft text-success font-medium">En attente validation</span>;
    case 'CLOTURE':
      return <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-ink-soft font-medium">Clôturé</span>;
    default:
      return null;
  }
}

export default function TechnicienTicketsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [tickets, setTickets] = useState<TicketTechnicien[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('diagnostics');

  useEffect(() => {
    getMesAffectations()
      .then(setTickets)
      .catch(() => toast.error('Erreur', 'Impossible de charger vos interventions.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === Séparation par onglet ===
  const diagnostics = useMemo(
    () => tickets.filter((t) => STATUTS_DIAGNOSTICS.includes(t.statut)),
    [tickets]
  );
  const interventions = useMemo(
    () => tickets.filter((t) => STATUTS_INTERVENTIONS.includes(t.statut)),
    [tickets]
  );
  const historique = useMemo(
    () => tickets.filter((t) => STATUTS_HISTORIQUE.includes(t.statut)),
    [tickets]
  );

  // === Liste active ===
  const listeActive = useMemo(() => {
    if (activeTab === 'diagnostics') return diagnostics;
    if (activeTab === 'interventions') return interventions;
    return historique;
  }, [activeTab, diagnostics, interventions, historique]);

  // === Filtrage + tri ===
  const listeAffichee = useMemo(() => {
    const tri = [...listeActive].sort((a, b) => b.id - a.id);
    if (!recherche.trim()) return tri;
    const q = recherche.toLowerCase();
    return tri.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        String(t.id).includes(q) ||
        `${t.client.first_name} ${t.client.last_name}`.toLowerCase().includes(q)
    );
  }, [listeActive, recherche]);

  // === Stats ===
  const stats = useMemo(
    () => ({
      diagnostics: diagnostics.length,
      interventions: interventions.length,
      historique: historique.length,
    }),
    [diagnostics, interventions, historique]
  );

  // === Onglets ===
  const tabs: TabItem[] = [
    {
      id: 'diagnostics',
      label: 'Diagnostics',
      icon: <ClipboardList size={14} />,
      badge: stats.diagnostics,
    },
    {
      id: 'interventions',
      label: 'Interventions',
      icon: <Wrench size={14} />,
      badge: stats.interventions,
    },
    {
      id: 'historique',
      label: 'Historique',
      icon: <History size={14} />,
      badge: stats.historique,
    },
  ];

  // === Message vide selon onglet ===
  const emptyMessage = () => {
    if (recherche.trim()) {
      return {
        icon: <Search size={24} />,
        title: 'Aucun résultat',
        description: `Aucun résultat pour "${recherche}".`,
        action: (
          <Button variant="secondary" onClick={() => setRecherche('')}>
            Effacer la recherche
          </Button>
        ),
      };
    }

    switch (activeTab) {
      case 'diagnostics':
        return {
          icon: <ClipboardList size={24} />,
          title: 'Aucun diagnostic en attente',
          description: "Vous n'avez aucun ticket à diagnostiquer pour le moment.",
        };
      case 'interventions':
        return {
          icon: <Wrench size={24} />,
          title: 'Aucune intervention à réaliser',
          description: "Vous n'avez aucun ticket prêt à être réparé. Attendez qu'un client accepte un devis.",
        };
      case 'historique':
        return {
          icon: <History size={24} />,
          title: 'Aucun historique',
          description: "Vous n'avez pas encore terminé d'intervention.",
        };
    }
  };

  const empty = emptyMessage();

  return (
    <AppShell
      title="Mes interventions"
      breadcrumb={['NjCam', 'Smart Ticket', 'Mes interventions']}
    >
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-info-soft text-info">
              <ClipboardList size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">Diagnostics</p>
              <p className="text-xl font-semibold text-ink">{stats.diagnostics}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-warning-soft text-warning">
              <Wrench size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">Interventions</p>
              <p className="text-xl font-semibold text-ink">{stats.interventions}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-success-soft text-success">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">Historique</p>
              <p className="text-xl font-semibold text-ink">{stats.historique}</p>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <Tabs tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

        {/* Recherche */}
        {tickets.length > 0 && (
          <Input
            placeholder="Rechercher par client, description ou référence…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            icon={<Search size={15} />}
          />
        )}

        {/* Liste */}
        {loading ? (
          <div className="bg-card border border-line rounded-lg p-12 text-center text-sm text-ink-soft">
            Chargement de vos tickets…
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Wrench size={24} />}
              title="Aucun ticket affecté"
              description="Vous n'avez pas encore de ticket. Votre superviseur vous en assignera prochainement."
            />
          </div>
        ) : listeAffichee.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={empty.icon}
              title={empty.title}
              description={empty.description}
              action={empty.action}
            />
          </div>
        ) : (
          <div className="space-y-2">
            {listeAffichee.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => navigate(`/smart-ticket/technicien/tickets/${ticket.id}`)}
                className={`w-full text-left bg-card border border-line rounded-lg p-4 hover:border-primary/40 hover:shadow-sm transition-all group ${
                  activeTab === 'historique' ? 'opacity-80' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-xs font-medium text-ink-soft">
                        {formatReference(ticket.id)}
                      </span>
                      <span className="text-xs text-ink-faint">•</span>
                      <span className="text-xs text-ink-soft">
                        {formatDate(ticket.date_creation)}
                      </span>
                      {/* Badge contextuel selon l'action à faire */}
                      {getActionBadge(ticket.statut)}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-ink line-clamp-2 mb-3 group-hover:text-primary transition-colors">
                      {ticket.description}
                    </p>

                    {/* Client */}
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        firstName={ticket.client.first_name}
                        lastName={ticket.client.last_name}
                        size="sm"
                      />
                      <span className="text-xs text-ink-soft">
                        {ticket.client.first_name} {ticket.client.last_name}
                      </span>
                      {ticket.client.telephone && (
                        <>
                          <span className="text-xs text-ink-faint">•</span>
                          <span className="text-xs text-ink-soft">
                            {ticket.client.telephone}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Badges à droite */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <PriorityBadge priorite={ticket.priorite} />
                    <StatusBadge statut={ticket.statut} />
                    <ArrowRight
                      size={16}
                      className="text-ink-faint group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1"
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}