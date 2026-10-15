import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Ticket as TicketIcon, AlertTriangle, 
   Filter, Eye, UserPlus, ArrowRight,
   ListFilter,
   Clock,
   Archive,
} from 'lucide-react';
import { getTousLesTickets, affecterTechnicien } from '../../api/ticketService';
import { getTechniciens } from '../../api/authService';
import type { TicketAdmin, TicketStatut, TicketPriorite } from '../../types/ticket';
import type { Utilisateur } from '../../types/user';
import { formatDate, formatReference, STATUT_LABELS } from '../../utils/ticketDisplay';
import AppShell from '../../components/layout/AppShell';
import KpiCard from '../../components/ui/KpiCard';
import DataTable, { type Column } from '../../components/ui/DataTable';
import Input from '../../components/ui/input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Drawer from '../../components/ui/Drawer';
import EmptyState from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import UserAvatar from '../../components/ui/UserAvatar';
import { useToast } from '../../context/ToastContext';
import Tabs from '../../components/ui/Tabs';

// Statuts considérés comme "actifs" (non archivés)
const STATUTS_ACTIFS: TicketStatut[] = [
  'BROUILLON', 'NOUVEAU', 'A_QUALIFIER', 'AFFECTE',
  'PLANIFIE', 'EN_ATTENTE', 'EN_COURS',
];

// Statuts archivés
const STATUTS_ARCHIVES: TicketStatut[] = ['RESOLU', 'CLOTURE'];

type TabId = 'tous' | 'actifs' | 'archives';
const STATUTS: { value: TicketStatut | ''; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  ...Object.entries(STATUT_LABELS).map(([value, label]) => ({
    value: value as TicketStatut,
    label,
  })),
];


export default function AdminTicketsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [tickets, setTickets] = useState<TicketAdmin[]>([]);
  const [techniciens, setTechniciens] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [statutFiltre, setStatutFiltre] = useState<string>('');
  const [recherche, setRecherche] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('actifs');
 const [sortBy, setSortBy] = useState<string>('id');  // ← 'id' au lieu de 'date_creation'
const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');  // ← reste 'desc'
  // Drawer
  const [selectedTicket, setSelectedTicket] = useState<TicketAdmin | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [technicienChoisi, setTechnicienChoisi] = useState<string>('');
  const [affectationEnCours, setAffectationEnCours] = useState(false);

  const charger = () => {
    setLoading(true);
    Promise.all([
     getTousLesTickets({
  statut: statutFiltre || undefined,
  search: recherche || undefined,
  ordering: '-id',  // ← '-id' au lieu de '-priorite,date_creation'
}),
      getTechniciens().catch(() => []),
    ])
      .then(([ticketsData, techsData]) => {
        setTickets(ticketsData);
        setTechniciens(techsData);
      })
      .catch(() => toast.error('Erreur', 'Impossible de charger les tickets.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = setTimeout(charger, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statutFiltre, recherche]);
// Compteurs par onglet
// Compteurs par onglet
const compteurs = useMemo(
  () => ({
    tous: tickets.length,
    actifs: tickets.filter((t) => STATUTS_ACTIFS.includes(t.statut)).length,
    archives: tickets.filter((t) => STATUTS_ARCHIVES.includes(t.statut)).length,
  }),
  [tickets]
);

const kpis = useMemo(() => {
  // Tickets ouverts : nouveau + à qualifier
  const ouverts = tickets.filter((t) =>
    ['NOUVEAU', 'A_QUALIFIER'].includes(t.statut)
  ).length;

  // Tickets affectés : affecté + planifié
  const affectes = tickets.filter((t) =>
    ['AFFECTE', 'PLANIFIE'].includes(t.statut)
  ).length;

  // Priorité moyenne
  const moyenne = tickets.filter((t) => t.priorite === 'MOYENNE').length;

  // Priorité haute + critique
  const haute = tickets.filter((t) =>
    ['HAUTE', 'CRITIQUE'].includes(t.priorite)
  ).length;

  return { ouverts, affectes, moyenne, haute };
}, [tickets]);

// === Tri + filtre par onglet ===
const ticketsTries = useMemo(() => {
  const ordrePriorite: Record<TicketPriorite, number> = {
    CRITIQUE: 4,
    HAUTE: 3,
    MOYENNE: 2,
    FAIBLE: 1,
  };

  // Filtrer par onglet actif
  let base = tickets;
  if (activeTab === 'actifs') {
    base = tickets.filter((t) => STATUTS_ACTIFS.includes(t.statut));
  } else if (activeTab === 'archives') {
    base = tickets.filter((t) => STATUTS_ARCHIVES.includes(t.statut));
  }

  const sorted = [...base].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'id':
        return (a.id - b.id) * dir;
      case 'date_creation': {
        const diffDate =
          new Date(a.date_creation).getTime() -
          new Date(b.date_creation).getTime();
        if (diffDate !== 0) return diffDate * dir;
        return (a.id - b.id) * dir;
      }
      case 'priorite':
        return (ordrePriorite[a.priorite] - ordrePriorite[b.priorite]) * dir;
      case 'statut':
        return a.statut.localeCompare(b.statut) * dir;
      default:
        // Par défaut : tri par ID décroissant (récent en haut)
        return (b.id - a.id);
    }
  });
  return sorted;
}, [tickets, sortBy, sortDir, activeTab]);
  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  const ouvrirDrawer = (ticket: TicketAdmin) => {
    setSelectedTicket(ticket);
    setTechnicienChoisi('');
    setDrawerOpen(true);
  };

  const handleAffecter = async () => {
    if (!selectedTicket || !technicienChoisi) return;
    setAffectationEnCours(true);
    try {
      const misAJour = await affecterTechnicien(selectedTicket.id, {
        technicien: Number(technicienChoisi),
      });
      setTickets((prev) =>
        prev.map((t) => (t.id === misAJour.id ? misAJour : t))
      );
      setSelectedTicket(misAJour);
      setTechnicienChoisi('');
      toast.success(
        'Technicien affecté',
        `Ticket ${formatReference(misAJour.id)} mis à jour.`
      );
    } catch (err: any) {
      toast.error(
        'Erreur',
        err?.response?.data?.detail || "Impossible d'affecter ce technicien."
      );
    } finally {
      setAffectationEnCours(false);
    }
  };

  // === Colonnes ===
  const columns: Column<TicketAdmin>[] = [
    {
      key: 'reference',
      header: 'Référence',
      width: '140px',
      render: (t) => (
        <span className="font-mono text-xs font-medium text-ink">
          {formatReference(t.id)}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Objet',
      render: (t) => (
        <p className="text-ink truncate max-w-md" title={t.description}>
          {t.description}
        </p>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      width: '180px',
      render: (t) => (
        <div className="flex items-center gap-2">
          <UserAvatar
            firstName={t.client.first_name}
            lastName={t.client.last_name}
            size="sm"
          />
          <span className="text-ink truncate">
            {t.client.first_name} {t.client.last_name}
          </span>
        </div>
      ),
    },
    {
      key: 'priorite',
      header: 'Priorité',
      width: '120px',
      sortable: true,
      render: (t) => <PriorityBadge priorite={t.priorite} />,
    },
    {
      key: 'statut',
      header: 'Statut',
      width: '130px',
      sortable: true,
      render: (t) => <StatusBadge statut={t.statut} />,
    },
    {
      key: 'technicien',
      header: 'Technicien',
      width: '180px',
      render: (t) =>
        t.technicien ? (
          <span className="text-ink truncate">
            {t.technicien.first_name} {t.technicien.last_name}
          </span>
        ) : (
          <span className="text-ink-faint italic text-xs">Non affecté</span>
        ),
    },
    {
      key: 'date_creation',
      header: 'Créé le',
      width: '130px',
      sortable: true,
      render: (t) => (
        <span className="text-ink-soft text-xs">{formatDate(t.date_creation)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      align: 'right',
      render: (t) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            ouvrirDrawer(t);
          }}
          className="p-1.5 rounded text-ink-soft hover:bg-surface hover:text-ink transition-colors"
          title="Voir le détail"
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];

  return (
    <AppShell title="Gestion des tickets" breadcrumb={['NjCam', 'Admin', 'Tickets']}>
      <div className="p-6 space-y-6">
        {/* KPIs */}
        {/* KPIs */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <KpiCard
    label="Tickets ouverts"
    value={kpis.ouverts}
    icon={<TicketIcon size={18} />}
    accent="primary"
  />
  <KpiCard
    label="Tickets affectés"
    value={kpis.affectes}
    icon={<UserPlus size={18} />}
    accent="info"
  />
  <KpiCard
    label="Priorité moyenne"
    value={kpis.moyenne}
    icon={<AlertTriangle size={18} />}
    accent="warning"
  />
  <KpiCard
    label="Priorité haute"
    value={kpis.haute}
    icon={<AlertTriangle size={18} />}
    accent="danger"
  />
</div>
{/* Onglets Tous / Actifs / Archivés */}
<Tabs
  tabs={[
    { id: 'tous', label: 'Tous', icon: <ListFilter size={14} />, badge: compteurs.tous },
    { id: 'actifs', label: 'Actifs', icon: <Clock size={14} />, badge: compteurs.actifs },
    { id: 'archives', label: 'Archivés', icon: <Archive size={14} />, badge: compteurs.archives },
  ]}
  active={activeTab}
  onChange={(id) => setActiveTab(id as TabId)}
/>
        {/* Filtres */}
        <div className="bg-card border border-line rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par description ou client…"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                icon={<Search size={15} />}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={statutFiltre}
                onChange={(e) => setStatutFiltre(e.target.value)}
              >
                {STATUTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              variant="secondary"
              icon={<Filter size={15} />}
              onClick={() => {
                setStatutFiltre('');
                setRecherche('');
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-card border border-line rounded-lg p-12 text-center text-sm text-ink-soft">
            Chargement des tickets…
          </div>
        ) : ticketsTries.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<TicketIcon size={24} />}
              title="Aucun ticket trouvé"
              description="Aucun ticket ne correspond à ces critères."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStatutFiltre('');
                    setRecherche('');
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              }
            />
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={ticketsTries}
            rowKey={(t) => t.id}
            onRowClick={ouvrirDrawer}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
        )}
      </div>

      {/* Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedTicket ? formatReference(selectedTicket.id) : ''}
        width="md"
        footer={
          selectedTicket && (
            <>
              <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
                Fermer
              </Button>
              <Button
                icon={<ArrowRight size={15} />}
                onClick={() => navigate(`/smart-ticket/admin/tickets/${selectedTicket.id}`)}
              >
                Voir le détail complet
              </Button>
            </>
          )
        }
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priorite={selectedTicket.priorite} />
              <StatusBadge statut={selectedTicket.statut} />
              {selectedTicket.priorite_modifiee_manuellement && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning-soft text-warning">
                  Priorité manuelle
                </span>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-1.5">
                Description
              </p>
              <p className="text-sm text-ink">{selectedTicket.description}</p>
            </div>

            {(selectedTicket.categorie ||
              selectedTicket.site ||
              selectedTicket.equipement) && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedTicket.categorie && (
                  <div>
                    <p className="text-xs text-ink-soft uppercase tracking-wide mb-0.5">
                      Catégorie
                    </p>
                    <p className="text-ink">{selectedTicket.categorie}</p>
                  </div>
                )}
                {selectedTicket.site && (
                  <div>
                    <p className="text-xs text-ink-soft uppercase tracking-wide mb-0.5">
                      Site
                    </p>
                    <p className="text-ink">{selectedTicket.site}</p>
                  </div>
                )}
                {selectedTicket.equipement && (
                  <div>
                    <p className="text-xs text-ink-soft uppercase tracking-wide mb-0.5">
                      Équipement
                    </p>
                    <p className="text-ink">{selectedTicket.equipement}</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2">
                Demandeur
              </p>
              <div className="flex items-center gap-3">
                <UserAvatar
                  firstName={selectedTicket.client.first_name}
                  lastName={selectedTicket.client.last_name}
                  size="md"
                />
                <div>
                  <p className="text-sm font-medium text-ink">
                    {selectedTicket.client.first_name} {selectedTicket.client.last_name}
                  </p>
                  {selectedTicket.client.telephone && (
                    <p className="text-xs text-ink-soft">
                      {selectedTicket.client.telephone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-1">
                  Créé le
                </p>
                <p className="text-sm text-ink">
                  {formatDate(selectedTicket.date_creation)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-1">
                  Technicien
                </p>
                <p className="text-sm text-ink">
                  {selectedTicket.technicien
                    ? `${selectedTicket.technicien.first_name} ${selectedTicket.technicien.last_name}`
                    : 'Non affecté'}
                </p>
              </div>
            </div>

            {selectedTicket.statut === 'NOUVEAU' && (
              <div className="border-t border-line pt-5">
                <p className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                  <UserPlus size={15} /> Affecter un technicien
                </p>
                <div className="space-y-3">
                  <Select
                    value={technicienChoisi}
                    onChange={(e) => setTechnicienChoisi(e.target.value)}
                  >
                    <option value="">Choisir un technicien…</option>
                    {techniciens.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.first_name} {t.last_name}
                        {t.specialite ? ` — ${t.specialite}` : ''}
                      </option>
                    ))}
                  </Select>
                  <Button
                    fullWidth
                    icon={<UserPlus size={15} />}
                    onClick={handleAffecter}
                    disabled={!technicienChoisi}
                    loading={affectationEnCours}
                  >
                    Affecter
                  </Button>
                </div>
              </div>
            )}

            {selectedTicket.statut !== 'NOUVEAU' && (
              <div className="border-t border-line pt-5 text-xs text-ink-soft bg-surface rounded-md p-3">
                Ce ticket est déjà au statut{' '}
                <strong>{STATUT_LABELS[selectedTicket.statut]}</strong>, l'affectation
                rapide n'est plus disponible ici.
              </div>
            )}
          </div>
        )}
      </Drawer>
    </AppShell>
  );
}