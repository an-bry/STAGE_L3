import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, UserPlus, Calendar, MessageSquare, FileText,
  Activity, AlertTriangle, Download, XCircle,
  Wrench, Package,
} from 'lucide-react';
import {
  getTicketDetailAdmin,
  affecterTechnicien,
  getHistoriqueTicket,
  getCommentaires,
  changerPrioriteManuelle,
  planifierIntervention,
  getPlanificationActive,
  annulerPlanification,
  telechargerRapportPDF,
  getTechniciensAvecCharge,
  type TechnicienCharge,
  type HistoriqueEntry,
  type Commentaire,
  type Planification,
} from '../../api/ticketService';
import type { TicketAdmin, InterventionSuivi } from '../../types/ticket';
import { formatDate, formatDateTime, formatReference } from '../../utils/ticketDisplay';
import {
  validateJustification,
  validateDureeEstimee,
  validateDateFuture,
  validateHeureFuture,
  JUSTIFICATION_MAX,
} from '../../utils/validators';
import AppShell from '../../components/layout/AppShell';
import Tabs, { type TabItem } from '../../components/ui/Tabs';
import Timeline, { type TimelineItem } from '../../components/ui/Timeline';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Texterea';
import { StatusBadge } from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import UserAvatar from '../../components/ui/UserAvatar';
import SLABadge from '../../components/ui/SLABadge';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';
import DevisSection from '../../components/smart-ticket/DevisSection';
import CommentairesSection from '../../components/smart-ticket/CommentairesSection';
import EquipementLieBloc from '../../components/smart-ticket/EquipementLieBloc';

type TabId = 'overview' | 'devis' | 'activity' | 'comments' | 'intervention' | 'planning';

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const ticketId = Number(id);

  const [ticket, setTicket] = useState<TicketAdmin | null>(null);
  const [techniciensCharge, setTechniciensCharge] = useState<TechnicienCharge[]>([]);
  const [historique, setHistorique] = useState<HistoriqueEntry[]>([]);
  const [, setCommentaires] = useState<Commentaire[]>([]);
  const [planification, setPlanification] = useState<Planification | null>(null);
  const [intervention, setIntervention] = useState<InterventionSuivi | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Modales
  const [affecterOpen, setAffecterOpen] = useState(false);
  const [confirmSurchargeOpen, setConfirmSurchargeOpen] = useState(false);
  const [prioriteOpen, setPrioriteOpen] = useState(false);
  const [planifOpen, setPlanifOpen] = useState(false);
  const [confirmAnnulerPlanif, setConfirmAnnulerPlanif] = useState(false);

  // Formulaires
  const [technicienChoisi, setTechnicienChoisi] = useState('');
  const [affectationEnCours, setAffectationEnCours] = useState(false);

  const [nouvellePriorite, setNouvellePriorite] = useState('');
  const [justification, setJustification] = useState('');
  const [prioriteEnCours, setPrioriteEnCours] = useState(false);

  const [planifDate, setPlanifDate] = useState('');
  const [planifHeure, setPlanifHeure] = useState('');
  const [planifDuree, setPlanifDuree] = useState(60);
  const [planifEnCours, setPlanifEnCours] = useState(false);

  // === Chargement ===
  const charger = async () => {
    setLoading(true);
    try {
      const [ticketData, techsData, histoData, commData, planifData] = await Promise.all([
        getTicketDetailAdmin(ticketId),
        getTechniciensAvecCharge().catch(() => []),
        getHistoriqueTicket(ticketId).catch(() => []),
        getCommentaires(ticketId).catch(() => []),
        getPlanificationActive(ticketId).catch(() => null),
      ]);
      setTicket(ticketData);
      setTechniciensCharge(techsData);
      setHistorique(histoData);
      setCommentaires(commData);
      setPlanification(planifData);
      setNouvellePriorite(ticketData.priorite);

      const interventions = ticketData.interventions || [];
      const derniereIntervention =
        interventions.length > 0 ? interventions[interventions.length - 1] : null;
      setIntervention(derniereIntervention);
    } catch {
      toast.error('Erreur', 'Impossible de charger ce ticket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  // === Technicien sélectionné ===
  const technicienSelectionne = useMemo(() => {
    if (!technicienChoisi) return null;
    return techniciensCharge.find((t) => t.id === Number(technicienChoisi)) || null;
  }, [technicienChoisi, techniciensCharge]);

  const technicienSurcharge = technicienSelectionne
    ? technicienSelectionne.charge_actuelle >= technicienSelectionne.charge_max
    : false;

  // === Timeline ===
  const timelineItems: TimelineItem[] = useMemo(() => {
    return historique.map((h) => {
      let variant: 'default' | 'primary' | 'warning' | 'danger' | 'success' = 'default';
      let title = h.champ_modifie_display;
      let description = h.justification || '';

      const justifLower = (h.justification || '').toLowerCase();

      if (h.champ_modifie === 'STATUT' && justifLower.includes('diagnostic')) {
        title = 'Diagnostic soumis';
        variant = 'success';
        description = h.justification;
      } else if (justifLower.includes('devis')) {
        title = h.justification;
        variant = 'success';
        description = '';
      } else if (h.champ_modifie === 'PLANIFICATION' || justifLower.includes('planifi')) {
        title = 'Planification';
        variant = 'primary';
        description = h.justification;
      } else if (h.champ_modifie === 'STATUT') {
        title = 'Changement de statut';
        variant = 'primary';
        description = h.justification
          ? `${h.ancienne_valeur || '∅'} → ${h.nouvelle_valeur} — ${h.justification}`
          : `${h.ancienne_valeur || '∅'} → ${h.nouvelle_valeur}`;
      } else if (h.champ_modifie === 'PRIORITE') {
        variant = 'warning';
        description = h.justification
          ? `${h.ancienne_valeur} → ${h.nouvelle_valeur} — ${h.justification}`
          : `${h.ancienne_valeur} → ${h.nouvelle_valeur}`;
      } else if (h.champ_modifie === 'TECHNICIEN') {
        variant = 'primary';
        description = h.justification
          ? `${h.ancienne_valeur} → ${h.nouvelle_valeur} — ${h.justification}`
          : `${h.ancienne_valeur} → ${h.nouvelle_valeur}`;
      }

      return {
        id: h.id,
        title,
        description,
        date: formatDateTime(h.date),
        variant,
      };
    });
  }, [historique]);

  // === Handlers ===
  const affecterDirectement = async () => {
    if (!ticket || !technicienChoisi) return;
    setAffectationEnCours(true);
    try {
      const misAJour = await affecterTechnicien(ticket.id, {
        technicien: Number(technicienChoisi),
      });
      setTicket(misAJour);
      setAffecterOpen(false);
      setConfirmSurchargeOpen(false);
      setTechnicienChoisi('');
      await charger();
      toast.success('Technicien affecté', 'Le ticket a été mis à jour.');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error('Erreur', detail || "Impossible d'affecter.");
    } finally {
      setAffectationEnCours(false);
    }
  };

  const handleAffecter = () => {
    if (!ticket || !technicienChoisi) return;

    const tech = techniciensCharge.find((t) => t.id === Number(technicienChoisi));
    if (!tech) return;

    if (tech.charge_actuelle >= tech.charge_max) {
      toast.error(
        'Technicien surchargé',
        `${tech.first_name} ${tech.last_name} a atteint la limite de ${tech.charge_max} tickets actifs.`
      );
      return;
    }

    if (tech.charge_actuelle >= tech.charge_avertissement) {
      setConfirmSurchargeOpen(true);
      return;
    }

    affecterDirectement();
  };

  const handlePrioriteManuelle = async (e: FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    const err = validateJustification(justification);
    if (err) {
      toast.error('Justification invalide', err);
      return;
    }

    if (nouvellePriorite === ticket.priorite) {
      toast.warning('Aucun changement', 'La priorité est identique.');
      return;
    }

    setPrioriteEnCours(true);
    try {
      const misAJour = await changerPrioriteManuelle(ticket.id, {
        priorite: nouvellePriorite,
        justification,
      });
      setTicket(misAJour);
      setPrioriteOpen(false);
      setJustification('');
      await charger();
      toast.success('Priorité mise à jour', `${nouvellePriorite} appliquée.`);
    } catch (err: any) {
      toast.error(
        'Erreur',
        err?.response?.data?.detail || 'Impossible de changer la priorité.'
      );
    } finally {
      setPrioriteEnCours(false);
    }
  };

  const handlePlanifier = async (e: FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    const errDate = validateDateFuture(planifDate);
    if (errDate) return toast.error('Date invalide', errDate);

    const errHeure = validateHeureFuture(planifDate, planifHeure);
    if (errHeure) return toast.error('Heure invalide', errHeure);

    const errDuree = validateDureeEstimee(planifDuree);
    if (errDuree) return toast.error('Durée invalide', errDuree);

    setPlanifEnCours(true);
    try {
      const p = await planifierIntervention(ticket.id, {
        date: planifDate,
        heure_debut: planifHeure,
        duree_estimee_minutes: planifDuree,
      });
      setPlanification(p);
      setPlanifOpen(false);
      await charger();
      toast.success('Planification créée', `${planifDate} à ${planifHeure}`);
    } catch (err: any) {
      toast.error(
        'Erreur',
        err?.response?.data?.detail || 'Impossible de planifier.'
      );
    } finally {
      setPlanifEnCours(false);
    }
  };

  const handleAnnulerPlanif = async () => {
    if (!planification) return;
    try {
      await annulerPlanification(planification.id);
      setPlanification(null);
      setConfirmAnnulerPlanif(false);
      await charger();
      toast.success('Planification annulée', '');
    } catch {
      toast.error('Erreur', "Impossible d'annuler.");
    }
  };

  const handleDownloadPDF = async () => {
    if (!intervention) {
      toast.warning('Aucun rapport', 'Aucune intervention sur ce ticket.');
      return;
    }
    try {
      await telechargerRapportPDF(intervention.id);
      toast.success('PDF téléchargé', '');
    } catch {
      toast.error('Erreur', 'Impossible de télécharger le PDF.');
    }
  };

  // === Onglets ===
  const tabs: TabItem[] = [
    { id: 'overview', label: "Vue d'ensemble", icon: <FileText size={14} /> },
    { id: 'devis', label: 'Devis', icon: <FileText size={14} /> },
    {
      id: 'activity',
      label: 'Activité',
      icon: <Activity size={14} />,
      badge: historique.length,
    },
    {
      id: 'comments',
      label: 'Commentaires',
      icon: <MessageSquare size={14} />,
    },
    { id: 'intervention', label: 'Intervention', icon: <Wrench size={14} /> },
    { id: 'planning', label: 'Planification', icon: <Calendar size={14} /> },
  ];

  // === Rendu ===
  if (loading) {
    return (
      <AppShell title="Ticket">
        <div className="p-6 text-ink-soft">Chargement…</div>
      </AppShell>
    );
  }

  if (!ticket) {
    return (
      <AppShell title="Ticket">
        <div className="p-6">
          <EmptyState
            icon={<AlertTriangle size={24} />}
            title="Ticket introuvable"
            action={
              <Button variant="secondary" onClick={() => navigate('/smart-ticket/admin/tickets')}>
                Retour à la liste
              </Button>
            }
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={formatReference(ticket.id)}
      breadcrumb={['NjCam', 'Admin', 'Tickets', formatReference(ticket.id)]}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        <button
          onClick={() => navigate('/smart-ticket/admin/tickets')}
          className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={16} /> Tous les tickets
        </button>

        <div className="bg-card border border-line rounded-lg p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <PriorityBadge priorite={ticket.priorite} />
                <StatusBadge statut={ticket.statut} />
                <SLABadge
                  slaRestant={ticket.sla_restant}
                  slaDepasse={ticket.sla_depasse}
                />
                {ticket.priorite_modifiee_manuellement && (
                  <Badge variant="warning" size="sm">
                    Priorité manuelle
                  </Badge>
                )}
              </div>
              <p className="text-sm text-ink">{ticket.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t border-line">
            {ticket.statut === 'NOUVEAU' && (
              <Button
                icon={<UserPlus size={15} />}
                onClick={() => setAffecterOpen(true)}
              >
                Affecter un technicien
              </Button>
            )}
            <Button
              variant="secondary"
              icon={<AlertTriangle size={15} />}
              onClick={() => setPrioriteOpen(true)}
            >
              Changer la priorité
            </Button>
            {ticket.technicien && ticket.statut !== 'CLOTURE' && (
              <Button
                variant="secondary"
                icon={<Calendar size={15} />}
                onClick={() => setPlanifOpen(true)}
              >
                {planification ? 'Replanifier' : 'Planifier'}
              </Button>
            )}
            <Button
              variant="secondary"
              icon={<Download size={15} />}
              onClick={handleDownloadPDF}
            >
              Rapport PDF
            </Button>
          </div>
        </div>

        <Tabs tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

        {activeTab === 'overview' && <OverviewTab ticket={ticket} onUpdate={charger} />}

        {activeTab === 'activity' && (
          <div className="bg-card border border-line rounded-lg p-6">
            <h3 className="text-base font-semibold text-ink mb-4">Historique</h3>
            <Timeline items={timelineItems} />
          </div>
        )}

        {activeTab === 'devis' && (
          <DevisSection
            ticketId={ticket.id}
            role="ADMIN"
            onUpdate={charger}
          />
        )}

        {activeTab === 'comments' && (
          <CommentairesSection ticketId={ticket.id} role="ADMIN" />
        )}

        {activeTab === 'intervention' && (
          <InterventionTab
            intervention={intervention}
            onDownloadPDF={handleDownloadPDF}
          />
        )}

        {activeTab === 'planning' && (
          <PlanningTab
            planification={planification}
            canPlanifier={!!ticket.technicien && ticket.statut !== 'CLOTURE'}
            onPlanifier={() => setPlanifOpen(true)}
            onAnnuler={() => setConfirmAnnulerPlanif(true)}
          />
        )}
      </div>

      <Modal
        open={affecterOpen}
        onClose={() => setAffecterOpen(false)}
        title="Affecter un technicien"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAffecterOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAffecter}
              loading={affectationEnCours}
              disabled={!technicienChoisi || technicienSurcharge}
              icon={<UserPlus size={15} />}
            >
              Affecter
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-ink-soft">
            La charge actuelle de chaque technicien est affichée pour éviter la surcharge.
          </p>

          {techniciensCharge.length === 0 ? (
            <p className="text-sm text-ink-soft text-center py-4">Chargement…</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {techniciensCharge.map((t) => {
                const surcharge = t.charge_actuelle >= t.charge_max;
                const presque = t.charge_actuelle >= t.charge_avertissement;
                const selectionne = Number(technicienChoisi) === t.id;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => !surcharge && setTechnicienChoisi(String(t.id))}
                    disabled={surcharge}
                    className={`
                      w-full text-left px-3 py-3 rounded-md border transition-all
                      ${surcharge ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/40 cursor-pointer'}
                      ${selectionne ? 'border-primary bg-primary-soft' : 'border-line'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        firstName={t.first_name}
                        lastName={t.last_name}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">
                          {t.first_name} {t.last_name}
                        </p>
                        <p className="text-xs text-ink-soft">
                          {t.specialite || 'Technicien'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm font-semibold ${
                            surcharge ? 'text-danger' : presque ? 'text-warning' : 'text-success'
                          }`}
                        >
                          {t.charge_actuelle} / {t.charge_max}
                        </p>
                        <p className="text-[10px] text-ink-soft uppercase">Tickets actifs</p>
                      </div>
                    </div>
                    {surcharge && (
                      <p className="text-xs text-danger mt-2 flex items-center gap-1">
                        <AlertTriangle size={11} /> Surchargé — choisissez un autre technicien
                      </p>
                    )}
                    {presque && !surcharge && (
                      <p className="text-xs text-warning mt-2 flex items-center gap-1">
                        <AlertTriangle size={11} /> Charge élevée — confirmation demandée
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmSurchargeOpen}
        onClose={() => setConfirmSurchargeOpen(false)}
        onConfirm={affecterDirectement}
        title="Technicien déjà chargé"
        message={
          technicienSelectionne
            ? `${technicienSelectionne.first_name} ${technicienSelectionne.last_name} a déjà ${technicienSelectionne.charge_actuelle} ticket(s) actif(s). Voulez-vous quand même l'affecter ?`
            : ''
        }
        confirmLabel="Oui, affecter quand même"
        cancelLabel="Choisir un autre"
        variant="primary"
        loading={affectationEnCours}
      />

      <Modal
        open={prioriteOpen}
        onClose={() => setPrioriteOpen(false)}
        title="Changer la priorité"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPrioriteOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handlePrioriteManuelle}
              loading={prioriteEnCours}
              disabled={!justification.trim() || nouvellePriorite === ticket.priorite}
            >
              Confirmer
            </Button>
          </>
        }
      >
        <form onSubmit={handlePrioriteManuelle} className="space-y-4">
          <Select
            label="Nouvelle priorité"
            value={nouvellePriorite}
            onChange={(e) => setNouvellePriorite(e.target.value)}
          >
            <option value="FAIBLE">Faible</option>
            <option value="MOYENNE">Moyenne</option>
            <option value="HAUTE">Haute</option>
            <option value="CRITIQUE">Critique</option>
          </Select>
          <Textarea
            label="Justification (obligatoire)"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={3}
            placeholder="Expliquez pourquoi vous changez la priorité…"
            error={
              justification.length > 0 && justification.trim().length < 10
                ? 'Minimum 10 caractères.'
                : undefined
            }
            hint={`${justification.length} / ${JUSTIFICATION_MAX}`}
          />
        </form>
      </Modal>

      <Modal
        open={planifOpen}
        onClose={() => setPlanifOpen(false)}
        title="Planifier une intervention"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPlanifOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handlePlanifier}
              loading={planifEnCours}
              disabled={!planifDate || !planifHeure}
              icon={<Calendar size={15} />}
            >
              Planifier
            </Button>
          </>
        }
      >
        <form onSubmit={handlePlanifier} className="space-y-4">
          <Input
            type="date"
            label="Date"
            value={planifDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setPlanifDate(e.target.value)}
          />
          <Input
            type="time"
            label="Heure de début"
            value={planifHeure}
            onChange={(e) => setPlanifHeure(e.target.value)}
          />
          <Input
            type="number"
            label="Durée estimée (minutes)"
            value={planifDuree}
            min={15}
            max={480}
            step={15}
            onChange={(e) => setPlanifDuree(Number(e.target.value))}
            hint="Entre 15 et 480 minutes (8h max)"
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmAnnulerPlanif}
        onClose={() => setConfirmAnnulerPlanif(false)}
        onConfirm={handleAnnulerPlanif}
        title="Annuler la planification"
        message="Êtes-vous sûr de vouloir annuler cette planification ? Cette action est irréversible."
        confirmLabel="Annuler la planification"
        variant="danger"
      />
    </AppShell>
  );
}

// ============================================
// SOUS-COMPOSANTS
// ============================================

function OverviewTab({ ticket, onUpdate }: { ticket: TicketAdmin; onUpdate: () => void }) { 
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      
      {/* Colonne de gauche */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-card border border-line rounded-lg p-6">
          <h3 className="text-sm font-semibold text-ink mb-3">Description</h3>
          <p className="text-sm text-ink-soft whitespace-pre-wrap">{ticket.description}</p>
        </div>

        <div className="bg-card border border-line rounded-lg p-6">
          <h3 className="text-sm font-semibold text-ink mb-3">Détails de l'incident</h3>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {ticket.categorie && <InfoRow label="Catégorie" value={ticket.categorie} />}
            {ticket.site && <InfoRow label="Site" value={ticket.site} />}
            {ticket.equipement && <InfoRow label="Équipement" value={ticket.equipement} />}
            {ticket.localisation_precise && (
              <InfoRow label="Localisation" value={ticket.localisation_precise} />
            )}
            <InfoRow label="Impact" value={ticket.niveau_impact} />
            <InfoRow
              label="Utilisateurs affectés"
              value={String(ticket.nombre_utilisateurs_affectes)}
            />
          </dl>
        </div>

        {/* 🔥 LE BLOC EST ICI MAINTENANT 🔥 */}
        <EquipementLieBloc
          ticketId={ticket.id}
          equipementRef={ticket.equipement_ref}
          equipementTexteLibre={ticket.equipement}
          clientId={ticket.client.id}
          onUpdate={onUpdate}
        />

      </div>

      {/* Colonne de droite */}
      <div className="space-y-4">
        <div className="bg-card border border-line rounded-lg p-6">
          <h3 className="text-sm font-semibold text-ink mb-3">Demandeur</h3>
          <div className="flex items-center gap-3">
            <UserAvatar
              firstName={ticket.client.first_name}
              lastName={ticket.client.last_name}
              size="md"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink truncate">
                {ticket.client.first_name} {ticket.client.last_name}
              </p>
              {ticket.client.telephone && (
                <p className="text-xs text-ink-soft">{ticket.client.telephone}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card border border-line rounded-lg p-6">
          <h3 className="text-sm font-semibold text-ink mb-3">Technicien</h3>
          {ticket.technicien ? (
            <div className="flex items-center gap-3">
              <UserAvatar
                firstName={ticket.technicien.first_name}
                lastName={ticket.technicien.last_name}
                size="md"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">
                  {ticket.technicien.first_name} {ticket.technicien.last_name}
                </p>
                {ticket.technicien.telephone && (
                  <p className="text-xs text-ink-soft">{ticket.technicien.telephone}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-faint italic">Non affecté</p>
          )}
        </div>

        <div className="bg-card border border-line rounded-lg p-6">
          <h3 className="text-sm font-semibold text-ink mb-3">Métadonnées</h3>
          <dl className="space-y-2 text-sm">
            <InfoRow label="Créé le" value={formatDate(ticket.date_creation)} />
            {ticket.date_heure_apparition && (
              <InfoRow label="Apparition" value={formatDateTime(ticket.date_heure_apparition)} />
            )}
            {ticket.sla_deadline && (
              <InfoRow label="SLA deadline" value={formatDateTime(ticket.sla_deadline)} />
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}

function InterventionTab({
  intervention,
  onDownloadPDF,
}: {
  intervention: InterventionSuivi | null;
  onDownloadPDF: () => void;
}) {
  if (!intervention) {
    return (
      <div className="bg-card border border-line rounded-lg">
        <EmptyState
          icon={<Wrench size={24} />}
          title="Aucun diagnostic"
          description="Le technicien n'a pas encore démarré le diagnostic sur ce ticket."
        />
      </div>
    );
  }

  return (
    <div className="bg-card border border-line rounded-lg p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink">Diagnostic du technicien</h3>
        <Button variant="secondary" icon={<Download size={15} />} onClick={onDownloadPDF} size="sm">
          Télécharger PDF
        </Button>
      </div>

      <div>
        <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-1">
          Diagnostic
        </p>
        <p className="text-sm text-ink whitespace-pre-wrap">{intervention.diagnostic}</p>
      </div>

      {intervention.symptomes_constates && (
        <div>
          <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-1">
            Symptômes constatés
          </p>
          <p className="text-sm text-ink whitespace-pre-wrap">
            {intervention.symptomes_constates}
          </p>
        </div>
      )}

      {intervention.tests_effectues && (
        <div>
          <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-1">
            Tests effectués
          </p>
          <p className="text-sm text-ink whitespace-pre-wrap">
            {intervention.tests_effectues}
          </p>
        </div>
      )}

      {intervention.resultat_intervention && (
        <div>
          <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-1">
            Résultat
          </p>
          <p className="text-sm text-ink whitespace-pre-wrap">
            {intervention.resultat_intervention}
          </p>
        </div>
      )}

      {intervention.pieces_demandees && intervention.pieces_demandees.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2 flex items-center gap-2">
            <Package size={12} /> Pièces nécessaires (à chiffrer) — {intervention.pieces_demandees.length}
          </p>
          <div className="border border-line rounded-md divide-y divide-line">
            {intervention.pieces_demandees.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div>
                  <p className="text-ink font-medium">{p.nom}</p>
                  <p className="text-xs text-ink-soft">
                    {p.reference && `Réf. ${p.reference} • `}
                    Quantité : {p.quantite}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-soft mt-2 italic">
            💡 Utilisez ces pièces pour établir le devis.
          </p>
        </div>
      )}

      {intervention.pieces_utilisees && intervention.pieces_utilisees.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2">
            Pièces utilisées — {intervention.pieces_utilisees.length}
          </p>
          <div className="border border-line rounded-md divide-y divide-line">
            {intervention.pieces_utilisees.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-ink">
                  {p.nom} x{p.quantite}
                  {p.reference && ` — ${p.reference}`}
                </span>
                <span className="text-ink-soft">
                  {p.cout_total.toLocaleString('fr-FR')} Ar
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlanningTab({
  planification,
  canPlanifier,
  onPlanifier,
  onAnnuler,
}: {
  planification: Planification | null;
  canPlanifier: boolean;
  onPlanifier: () => void;
  onAnnuler: () => void;
}) {
  if (!planification) {
    return (
      <div className="bg-card border border-line rounded-lg">
        <EmptyState
          icon={<Calendar size={24} />}
          title="Aucune planification"
          description={
            canPlanifier
              ? 'Aucune intervention planifiée pour ce ticket.'
              : "Le ticket doit être affecté à un technicien avant d'être planifié."
          }
          action={
            canPlanifier ? (
              <Button icon={<Calendar size={15} />} onClick={onPlanifier}>
                Planifier une intervention
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="bg-card border border-line rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink">Planification active</h3>
        <Badge variant={planification.statut === 'PLANIFIEE' ? 'success' : 'neutral'}>
          {planification.statut === 'PLANIFIEE' ? 'Planifiée' : 'Annulée'}
        </Badge>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <InfoRow label="Date" value={formatDate(planification.date)} />
        <InfoRow label="Horaire" value={`${planification.heure_debut} → ${planification.heure_fin}`} />
        <InfoRow label="Durée" value={`${planification.duree_estimee_minutes} min`} />
        <InfoRow
          label="Technicien"
          value={`${planification.technicien.first_name} ${planification.technicien.last_name}`}
        />
      </dl>

      {planification.statut === 'PLANIFIEE' && (
        <div className="flex gap-2 pt-4 border-t border-line">
          <Button variant="danger" icon={<XCircle size={15} />} onClick={onAnnuler}>
            Annuler la planification
          </Button>
          <Button variant="secondary" icon={<Calendar size={15} />} onClick={onPlanifier}>
            Replanifier
          </Button>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-soft uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm text-ink">{value}</dd>
    </div>
  );
}