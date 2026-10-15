import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Ticket as TicketIcon, Search, 
  CheckCircle2, Clock, FileText, ChevronRight, MapPin,
  Package, Users, Calendar, Info, Sparkles,
  Archive, ListFilter,
} from 'lucide-react';
import { getMesTickets, creerTicket } from '../../api/ticketService';
import type { Ticket, TicketCreateData, TicketImpact, TicketStatut } from '../../types/ticket';
import { formatDate, formatReference } from '../../utils/ticketDisplay';
import {
  validateDescription,
  validateNombreUtilisateurs,
  validateDatePassee,
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
} from '../../utils/validators';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Texterea';
import Modal from '../../components/ui/Modal';
import Stepper, { type Step } from '../../components/ui/Stepper';
import Tabs, { type TabItem } from '../../components/ui/Tabs';
import EmptyState from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';

import { useToast } from '../../context/ToastContext';

// ============================================
// CONSTANTES
// ============================================
const CATEGORIES = [
  'Panne matérielle',
  'Panne logicielle',
  'Réseau / Connexion',
  'Sécurité',
  'Maintenance préventive',
  'Installation',
  'Autre',
];

const IMPACTS: { value: TicketImpact; label: string; description: string }[] = [
  { value: 'FAIBLE', label: 'Faible', description: '1 personne impactée' },
  { value: 'MOYEN', label: 'Moyen', description: '2 à 5 personnes' },
  { value: 'ELEVE', label: 'Élevé', description: '6 à 20 personnes' },
  { value: 'CRITIQUE', label: 'Critique', description: "Toute l'entreprise" },
];

const ETAPES: Step[] = [
  { id: 'infos', label: 'Informations' },
  { id: 'localisation', label: 'Localisation' },
  { id: 'details', label: 'Détails' },
  { id: 'verif', label: 'Vérification' },
];

// Statuts considérés comme "en cours" (non archivés)
const STATUTS_ACTIFS: TicketStatut[] = [
  'BROUILLON', 'NOUVEAU', 'A_QUALIFIER', 'AFFECTE',
  'PLANIFIE', 'EN_ATTENTE', 'EN_COURS',
];

// Statuts archivés
const STATUTS_ARCHIVES: TicketStatut[] = ['RESOLU', 'CLOTURE'];

type TabId = 'en_cours' | 'archives';

export default function ClientTicketsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('en_cours');

  // Modal création
  const [modalOpen, setModalOpen] = useState(false);
  const [etape, setEtape] = useState(0);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  // Formulaire
  const [description, setDescription] = useState('');
  const [categorie, setCategorie] = useState('');
  const [equipement, setEquipement] = useState('');
  const [site, setSite] = useState('');
  const [localisationPrecise, setLocalisationPrecise] = useState('');
  const [niveauImpact, setNiveauImpact] = useState<TicketImpact>('MOYEN');
  const [nbUtilisateurs, setNbUtilisateurs] = useState(1);
  const [dateApparition, setDateApparition] = useState('');
  const [disponibilites, setDisponibilites] = useState('');
  const [erreurs, setErreurs] = useState<Record<string, string>>({});

  // === Chargement ===
  const chargerTickets = () => {
    setLoading(true);
    getMesTickets()
      .then(setTickets)
      .catch(() => toast.error('Erreur', 'Impossible de charger vos tickets.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    chargerTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === Séparation actifs / archivés ===
  const enCours = useMemo(
    () => tickets.filter((t) => STATUTS_ACTIFS.includes(t.statut)),
    [tickets]
  );
  const archives = useMemo(
    () => tickets.filter((t) => STATUTS_ARCHIVES.includes(t.statut)),
    [tickets]
  );

  // === Filtrage + tri ===
  const ticketsAffiches = useMemo(() => {
    const base = activeTab === 'en_cours' ? enCours : archives;
    let filtered = [...base].sort((a, b) => b.id - a.id);

    if (recherche.trim()) {
      const q = recherche.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          String(t.id).includes(q) ||
          t.categorie?.toLowerCase().includes(q) ||
          t.site?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [activeTab, enCours, archives, recherche]);

  // === Stats ===
  const stats = useMemo(
    () => ({
      total: tickets.length,
      enCours: enCours.length,
      archives: archives.length,
    }),
    [tickets, enCours, archives]
  );

  // === Estimation priorité ===
  const estimationPriorite = useMemo(() => {
    const len = description.trim().length;
    if (len < 10) return null;

    const motsUrgence = ['urgent', 'critique', 'panne', 'bloqué', 'bloque', 'immédiat', 'immediat', 'hs', 'down'];
    const contientUrgence = motsUrgence.some((m) => description.toLowerCase().includes(m));

    if (niveauImpact === 'CRITIQUE' || contientUrgence) {
      return { label: 'Critique', variant: 'danger' as const, sla: '4h' };
    }
    if (niveauImpact === 'ELEVE' || len > 200) {
      return { label: 'Haute', variant: 'danger' as const, sla: '24h' };
    }
    if (niveauImpact === 'MOYEN') {
      return { label: 'Moyenne', variant: 'neutral' as const, sla: '3 jours' };
    }
    return { label: 'Faible', variant: 'neutral' as const, sla: '7 jours' };
  }, [description, niveauImpact]);

  // === Validation ===
  const validerEtape = (etapeIndex: number): boolean => {
    const e: Record<string, string> = {};

    if (etapeIndex === 0) {
      const errDesc = validateDescription(description);
      if (errDesc) e.description = errDesc;
      if (!categorie) e.categorie = 'La catégorie est obligatoire.';
    }

    if (etapeIndex === 2) {
      const errUsers = validateNombreUtilisateurs(nbUtilisateurs);
      if (errUsers) e.nbUtilisateurs = errUsers;

      if (dateApparition) {
        const errDate = validateDatePassee(dateApparition);
        if (errDate) e.dateApparition = errDate;
      }
    }

    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  const allerEtapeSuivante = () => {
    if (validerEtape(etape)) setEtape((s) => Math.min(s + 1, ETAPES.length - 1));
  };

  const allerEtapePrecedente = () => {
    setEtape((s) => Math.max(s - 1, 0));
  };

  // === Création ===
  const handleCreerTicket = async (e: FormEvent) => {
    e.preventDefault();
    if (!validerEtape(0) || !validerEtape(2)) return;

    setEnvoiEnCours(true);
    try {
      const data: TicketCreateData = {
        description: description.trim(),
        categorie: categorie.trim(),
        equipement: equipement.trim(),
        site: site.trim(),
        localisation_precise: localisationPrecise.trim(),
        niveau_impact: niveauImpact,
        nombre_utilisateurs_affectes: nbUtilisateurs,
        date_heure_apparition: dateApparition ? new Date(dateApparition).toISOString() : null,
        disponibilites_client: disponibilites.trim(),
      };

      await creerTicket(data);
      toast.success('Ticket créé', 'Votre demande a bien été enregistrée.');
      resetForm();
      setModalOpen(false);
      chargerTickets();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || 'Une erreur est survenue.');
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const resetForm = () => {
    setEtape(0);
    setDescription('');
    setCategorie('');
    setEquipement('');
    setSite('');
    setLocalisationPrecise('');
    setNiveauImpact('MOYEN');
    setNbUtilisateurs(1);
    setDateApparition('');
    setDisponibilites('');
    setErreurs({});
  };

  const fermerModal = () => {
    if (envoiEnCours) return;
    setModalOpen(false);
    resetForm();
  };

  // === Onglets ===
  const tabs: TabItem[] = [
    { id: 'en_cours', label: 'En cours', icon: <ListFilter size={14} />, badge: enCours.length },
    { id: 'archives', label: 'Archivés', icon: <Archive size={14} />, badge: archives.length },
  ];

  return (
    <AppShell
      title="Mes tickets"
      breadcrumb={['NjCam', 'Smart Ticket', 'Mes tickets']}
      actions={
        <Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
          Nouveau ticket
        </Button>
      }
    >
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total" value={stats.total} icon={<FileText size={18} />} accent="primary" />
          <StatCard label="En cours" value={stats.enCours} icon={<Clock size={18} />} accent="warning" />
          <StatCard label="Archivés" value={stats.archives} icon={<CheckCircle2 size={18} />} accent="success" />
        </div>

        {/* Onglets */}
        <Tabs tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

        {/* Recherche */}
        {tickets.length > 0 && (
          <Input
            placeholder="Rechercher dans mes tickets…"
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
              icon={<TicketIcon size={24} />}
              title="Aucun ticket pour l'instant"
              description="Créez votre premier ticket pour signaler un incident."
              action={
                <Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
                  Créer mon premier ticket
                </Button>
              }
            />
          </div>
        ) : ticketsAffiches.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={recherche.trim() ? <Search size={24} /> : activeTab === 'en_cours' ? <CheckCircle2 size={24} /> : <Archive size={24} />}
              title={
                recherche.trim()
                  ? 'Aucun résultat'
                  : activeTab === 'en_cours'
                  ? 'Aucun ticket en cours'
                  : 'Aucun ticket archivé'
              }
              description={
                recherche.trim()
                  ? `Aucun résultat pour "${recherche}".`
                  : activeTab === 'en_cours'
                  ? 'Tous vos tickets sont archivés.'
                  : "Vous n'avez pas encore de ticket résolu."
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
            {ticketsAffiches.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => navigate(`/smart-ticket/client/tickets/${ticket.id}`)}
                className={`w-full text-left bg-card border border-line rounded-lg p-4 hover:border-primary/40 hover:shadow-sm transition-all group ${
                  activeTab === 'archives' ? 'opacity-80' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-xs font-medium text-ink-soft">
                        {formatReference(ticket.id)}
                      </span>
                      <span className="text-xs text-ink-faint">•</span>
                      <span className="text-xs text-ink-soft">
                        {formatDate(ticket.date_creation)}
                      </span>
                      {ticket.categorie && (
                        <>
                          <span className="text-xs text-ink-faint">•</span>
                          <span className="text-xs text-ink-soft">{ticket.categorie}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-ink line-clamp-2 group-hover:text-primary transition-colors">
                      {ticket.description}
                    </p>
                    {ticket.site && (
                      <p className="text-xs text-ink-soft mt-1.5 flex items-center gap-1">
                        <MapPin size={11} /> {ticket.site}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <PriorityBadge priorite={ticket.priorite} />
                    <StatusBadge statut={ticket.statut} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal Création */}
      <Modal
        open={modalOpen}
        onClose={fermerModal}
        title="Signaler un incident"
        size="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div>
              {etape > 0 && (
                <Button variant="secondary" onClick={allerEtapePrecedente} disabled={envoiEnCours}>
                  Précédent
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={fermerModal} disabled={envoiEnCours}>
                Annuler
              </Button>
              {etape < ETAPES.length - 1 ? (
                <Button onClick={allerEtapeSuivante} icon={<ChevronRight size={15} />}>
                  Suivant
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    const form = document.getElementById('form-ticket') as HTMLFormElement;
                    form?.requestSubmit();
                  }}
                  loading={envoiEnCours}
                  icon={<CheckCircle2 size={15} />}
                >
                  Envoyer le ticket
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="mb-6 pb-4 border-b border-line">
          <Stepper steps={ETAPES} current={etape} onStepClick={(i) => i <= etape && setEtape(i)} />
        </div>

        <form id="form-ticket" onSubmit={handleCreerTicket}>
          {/* ÉTAPE 0 */}
          {etape === 0 && (
            <div className="space-y-5">
              <div className="flex items-start gap-2 p-3 bg-info-soft rounded-md text-info text-xs">
                <Info size={14} className="shrink-0 mt-0.5" />
                <span>Décrivez précisément le problème.</span>
              </div>

              <Select
                label="Catégorie d'incident"
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                error={erreurs.categorie}
              >
                <option value="">Choisir une catégorie…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>

              <Textarea
                label="Description de l'incident"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Décrivez précisément le problème (10 caractères minimum)…"
                error={erreurs.description}
                hint={`${description.trim().length} / ${DESCRIPTION_MAX} caractères (min ${DESCRIPTION_MIN})`}
              />

              {estimationPriorite && (
                <div className="bg-surface rounded-md p-3 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-primary" />
                    <span className="text-xs text-ink-soft">Priorité estimée :</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        estimationPriorite.variant === 'danger'
                          ? 'bg-danger-soft text-danger'
                          : 'bg-card text-ink-soft border border-line'
                      }`}
                    >
                      {estimationPriorite.label}
                    </span>
                    <span className="text-xs text-ink-faint">• SLA ~{estimationPriorite.sla}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ÉTAPE 1 */}
          {etape === 1 && (
            <div className="space-y-5">
              <Input
                label="Site"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                placeholder="Ex : Siège social, Agence Nord…"
                icon={<MapPin size={15} />}
              />
              <Input
                label="Équipement concerné"
                value={equipement}
                onChange={(e) => setEquipement(e.target.value)}
                placeholder="Ex : Imprimante HP-4520…"
                icon={<Package size={15} />}
              />
              <Input
                label="Localisation précise (optionnel)"
                value={localisationPrecise}
                onChange={(e) => setLocalisationPrecise(e.target.value)}
                placeholder="Ex : 2e étage, salle 204…"
              />
            </div>
          )}

          {/* ÉTAPE 2 */}
          {etape === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Niveau d'impact</label>
                <div className="grid grid-cols-2 gap-2">
                  {IMPACTS.map((imp) => (
                    <button
                      key={imp.value}
                      type="button"
                      onClick={() => setNiveauImpact(imp.value)}
                      className={`text-left px-3 py-2.5 rounded-md border transition-colors ${
                        niveauImpact === imp.value
                          ? 'border-primary bg-primary-soft'
                          : 'border-line hover:border-line-strong'
                      }`}
                    >
                      <p className="text-sm font-medium text-ink">{imp.label}</p>
                      <p className="text-xs text-ink-soft">{imp.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Input
                type="number"
                label="Nombre d'utilisateurs affectés"
                value={nbUtilisateurs}
                min={1}
                max={10000}
                onChange={(e) => setNbUtilisateurs(Number(e.target.value))}
                error={erreurs.nbUtilisateurs}
                icon={<Users size={15} />}
              />

              <Input
                type="datetime-local"
                label="Date et heure d'apparition (optionnel)"
                value={dateApparition}
                onChange={(e) => setDateApparition(e.target.value)}
                error={erreurs.dateApparition}
                icon={<Calendar size={15} />}
              />

              <Input
                label="Disponibilités (optionnel)"
                value={disponibilites}
                onChange={(e) => setDisponibilites(e.target.value)}
                placeholder="Ex : Lun-Ven 9h-17h…"
              />
            </div>
          )}

          {/* ÉTAPE 3 */}
          {etape === 3 && (
            <div className="space-y-5">
              <div className="bg-surface rounded-md p-3 flex items-start gap-2">
                <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
                <span className="text-xs text-ink-soft">
                  Vérifiez les informations avant envoi.
                </span>
              </div>

              <div className="bg-card border border-line rounded-md divide-y divide-line">
                <RecapRow label="Catégorie" value={categorie || '—'} />
                <RecapRow label="Description" value={description} multiline />
                <RecapRow label="Site" value={site || '—'} />
                <RecapRow label="Équipement" value={equipement || '—'} />
                <RecapRow label="Localisation" value={localisationPrecise || '—'} />
                <RecapRow label="Impact" value={IMPACTS.find((i) => i.value === niveauImpact)?.label || '—'} />
                <RecapRow label="Utilisateurs" value={String(nbUtilisateurs)} />
                <RecapRow label="Apparition" value={dateApparition ? new Date(dateApparition).toLocaleString('fr-FR') : 'Non spécifiée'} />
                <RecapRow label="Disponibilités" value={disponibilites || 'Non spécifiées'} />
              </div>
            </div>
          )}
        </form>
      </Modal>
    </AppShell>
  );
}

// ============================================
// SOUS-COMPOSANTS
// ============================================
function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: 'primary' | 'warning' | 'success' }) {
  const accents = {
    primary: 'bg-primary-soft text-primary',
    warning: 'bg-warning-soft text-warning',
    success: 'bg-success-soft text-success',
  };
  return (
    <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
      <div className={`p-2 rounded-md ${accents[accent]}`}>{icon}</div>
      <div>
        <p className="text-xs text-ink-soft">{label}</p>
        <p className="text-xl font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}

function RecapRow({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="px-4 py-3 flex gap-4">
      <p className="text-xs text-ink-soft uppercase tracking-wide shrink-0 w-40 pt-0.5">{label}</p>
      <p className={`text-sm text-ink flex-1 ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value}</p>
    </div>
  );
}