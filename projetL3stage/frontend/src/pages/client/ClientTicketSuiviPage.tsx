import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, MessageSquare, FileText,
  Activity, Download,  AlertTriangle, Wrench,
} from 'lucide-react';
import {
  getTicketSuivi,
  validerIntervention,
  getHistoriqueTicket,
  getCommentaires,
  telechargerRapportPDF,
  type HistoriqueEntry,
  type Commentaire,
} from '../../api/ticketService';
import type { TicketSuivi } from '../../types/ticket';
import { formatDate, formatDateTime, formatReference } from '../../utils/ticketDisplay';

import AppShell from '../../components/layout/AppShell';
import Tabs, { type TabItem } from '../../components/ui/Tabs';
import Timeline, { type TimelineItem } from '../../components/ui/Timeline';
import Stepper, { type Step } from '../../components/ui/Stepper';

import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { StatusBadge, InterventionStatusBadge } from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import UserAvatar from '../../components/ui/UserAvatar';
import SLABadge from '../../components/ui/SLABadge';
import { useToast } from '../../context/ToastContext';
import DevisSection from '../../components/smart-ticket/DevisSection';
import CommentairesSection from '../../components/smart-ticket/CommentairesSection';

type TabId = 'overview' |'devis'| 'activity' | 'comments' | 'intervention';

// Étapes visuelles du workflow
const ETAPES: Step[] = [
  { id: 'cree', label: 'Créé' },
  { id: 'qualifie', label: 'Qualifié' },
  { id: 'affecte', label: 'Affecté' },
  { id: 'intervention', label: 'Intervention' },
  { id: 'cloture', label: 'Clôturé' },
];

function getEtapeIndex(statut: string): number {
  switch (statut) {
    case 'BROUILLON':
    case 'NOUVEAU':
      return 0;
    case 'A_QUALIFIER':
      return 1;
    case 'AFFECTE':
    case 'PLANIFIE':
      return 2;
    case 'EN_COURS':
    case 'EN_ATTENTE':
    case 'RESOLU':
      return 3;
    case 'CLOTURE':
      return 4;
    default:
      return 0;
  }
}

export default function ClientTicketSuiviPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const ticketId = Number(id);

  const [ticket, setTicket] = useState<TicketSuivi | null>(null);
  const [historique, setHistorique] = useState<HistoriqueEntry[]>([]);
  const [, setCommentaires] = useState<Commentaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Validation
  const [confirmValider, setConfirmValider] = useState(false);
  const [validationEnCours, setValidationEnCours] = useState(false);

  // Commentaire
  const [] = useState('');
  const [] = useState(false);

  // PDF
  const [pdfEnCours, setPdfEnCours] = useState(false);

  // === Chargement ===
  const charger = async () => {
    setLoading(true);
    try {
      const [ticketData, histoData, commData] = await Promise.all([
        getTicketSuivi(ticketId),
        getHistoriqueTicket(ticketId).catch(() => []),
        getCommentaires(ticketId).catch(() => []),
      ]);
      setTicket(ticketData);
      setHistorique(histoData);
      setCommentaires(commData);
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

  // === Timeline ===
  const timelineItems: TimelineItem[] = useMemo(() => {
    return historique.map((h) => ({
      id: h.id,
      title: h.champ_modifie_display,
      description: h.justification
        ? `${h.ancienne_valeur || '∅'} → ${h.nouvelle_valeur} — ${h.justification}`
        : `${h.ancienne_valeur || '∅'} → ${h.nouvelle_valeur}`,
      date: formatDateTime(h.date),
      variant:
        h.champ_modifie === 'STATUT'
          ? 'primary'
          : h.champ_modifie === 'PRIORITE'
          ? 'warning'
          : 'default',
    }));
  }, [historique]);

  // === Handlers ===
  const handleValider = async () => {
    if (!ticket?.intervention) return;
    setValidationEnCours(true);
    try {
      await validerIntervention(ticket.intervention.id);
      setConfirmValider(false);
      await charger();
      toast.success('Intervention validée', 'Votre ticket est maintenant clôturé.');
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || 'Impossible de valider.');
    } finally {
      setValidationEnCours(false);
    }
  };


  const handleDownloadPDF = async () => {
    if (!ticket?.intervention) return;
    setPdfEnCours(true);
    try {
      await telechargerRapportPDF(ticket.intervention.id, false); // client ne voit pas les prix par défaut
      toast.success('PDF téléchargé', '');
    } catch {
      toast.error('Erreur', 'Impossible de télécharger le PDF.');
    } finally {
      setPdfEnCours(false);
    }
  };

  // === Onglets ===
  const tabs: TabItem[] = [
  { id: 'overview', label: "Vue d'ensemble", icon: <FileText size={14} /> },
  { id: 'devis', label: 'Devis', icon: <FileText size={14} /> },
  { id: 'activity', label: 'Activité', icon: <Activity size={14} />, badge: historique.length },
  { id: 'comments', label: 'Commentaires', icon: <MessageSquare size={14} /> },
  { id: 'intervention', label: 'Intervention', icon: <Wrench size={14} /> },
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
              <Button variant="secondary" onClick={() => navigate('/smart-ticket/client/tickets')}>
                Retour à mes tickets
              </Button>
            }
          />
        </div>
      </AppShell>
    );
  }

  const intervention = ticket.intervention;
  const peutValider = intervention?.statut === 'TERMINEE';
  const etapeIndex = getEtapeIndex(ticket.statut);

  return (
    <AppShell
      title={formatReference(ticket.id)}
      breadcrumb={['NjCam', 'Client', 'Mes tickets', formatReference(ticket.id)]}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        {/* Bouton retour */}
        <button
          onClick={() => navigate('/smart-ticket/client/tickets')}
          className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={16} /> Mes tickets
        </button>

        {/* En-tête */}
        <div className="bg-card border border-line rounded-lg p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <PriorityBadge priorite={ticket.priorite} />
                <StatusBadge statut={ticket.statut} />
                <SLABadge slaRestant={ticket.sla_restant} slaDepasse={ticket.sla_depasse} />
              </div>
              <p className="text-sm text-ink">{ticket.description}</p>
            </div>
          </div>

          {/* Progression visuelle */}
          <div className="pt-4 border-t border-line">
            <Stepper steps={ETAPES} current={etapeIndex} />
          </div>
        </div>

        {/* Bandeau validation */}
        {peutValider && (
          <div className="bg-success-soft border border-success/30 rounded-lg p-5 flex items-start gap-4">
            <CheckCircle size={22} className="text-success shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink mb-1">
                Intervention terminée — En attente de votre validation
              </p>
              <p className="text-sm text-ink-soft mb-3">
                Le technicien a terminé son intervention. Vérifiez le diagnostic et les pièces
                utilisées, puis validez pour clôturer le ticket.
              </p>
              <Button
                variant="success"
                icon={<CheckCircle size={15} />}
                onClick={() => setConfirmValider(true)}
              >
                Valider l'intervention
              </Button>
            </div>
          </div>
        )}

        {intervention?.statut === 'VALIDEE' && (
          <div className="bg-success-soft border border-success/30 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle size={18} className="text-success shrink-0" />
            <p className="text-sm text-success font-medium">
              Intervention validée — Ticket clôturé
            </p>
          </div>
        )}

        {/* Onglets */}
        <Tabs tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

        {/* Contenu */}
        {activeTab === 'overview' && <OverviewTab ticket={ticket} />}

        {activeTab === 'activity' && (
          <div className="bg-card border border-line rounded-lg p-6">
            <h3 className="text-base font-semibold text-ink mb-4">Historique du ticket</h3>
            <Timeline items={timelineItems} />
          </div>
        )}
{activeTab === 'devis' && (
  <DevisSection
    ticketId={ticket.id}
    role="CLIENT"
    onUpdate={charger}
  />
)}
  {activeTab === 'comments' && (
  <CommentairesSection ticketId={ticket.id} role="CLIENT" />
)}

        {activeTab === 'intervention' && (
          <InterventionTab
            intervention={intervention}
            onDownloadPDF={handleDownloadPDF}
            pdfEnCours={pdfEnCours}
          />
        )}
      </div>

      {/* Confirm Valider */}
      <ConfirmDialog
        open={confirmValider}
        onClose={() => setConfirmValider(false)}
        onConfirm={handleValider}
        title="Valider l'intervention"
        message="En validant, vous confirmez que l'intervention est conforme à vos attentes. Le ticket sera définitivement clôturé."
        confirmLabel="Valider et clôturer"
        variant="primary"
        loading={validationEnCours}
      />
    </AppShell>
  );
}

// ============================================
// SOUS-COMPOSANTS
// ============================================

function OverviewTab({ ticket }: { ticket: TicketSuivi }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
      </div>

      <div className="space-y-4">
        <div className="bg-card border border-line rounded-lg p-6">
          <h3 className="text-sm font-semibold text-ink mb-3">Technicien assigné</h3>
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
            <p className="text-sm text-ink-faint italic">En attente d'affectation</p>
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
              <InfoRow label="Échéance SLA" value={formatDateTime(ticket.sla_deadline)} />
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
  pdfEnCours,
}: {
  intervention: TicketSuivi['intervention'];
  onDownloadPDF: () => void;
  pdfEnCours: boolean;
}) {
  if (!intervention) {
    return (
      <div className="bg-card border border-line rounded-lg">
        <EmptyState
          icon={<Wrench size={24} />}
          title="Aucune intervention"
          description="Un technicien n'a pas encore démarré d'intervention sur ce ticket."
        />
      </div>
    );
  }

  return (
    <div className="bg-card border border-line rounded-lg p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-ink">
            Intervention #{intervention.id}
          </h3>
          <InterventionStatusBadge statut={intervention.statut} />
        </div>
        {intervention.rapport && (
          <Button
            variant="secondary"
            icon={<Download size={15} />}
            onClick={onDownloadPDF}
            loading={pdfEnCours}
          >
            Télécharger le rapport PDF
          </Button>
        )}
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

      {(intervention.cause_confirmee || intervention.cause_probable) && (
        <div>
          <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-1">
            Cause
          </p>
          <p className="text-sm text-ink">
            {intervention.cause_confirmee || intervention.cause_probable}
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

      {intervention.temps_passe_minutes && (
        <div>
          <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-1">
            Temps passé
          </p>
          <p className="text-sm text-ink">{intervention.temps_passe_minutes} min</p>
        </div>
      )}

      {intervention.pieces_utilisees?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2">
            Pièces utilisées
          </p>
          <div className="border border-line rounded-md divide-y divide-line">
            {intervention.pieces_utilisees.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-ink">
                  {p.nom} x{p.quantite}
                  {p.reference && ` — ${p.reference}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2">
          Technicien
        </p>
        <div className="flex items-center gap-3">
          <UserAvatar
            firstName={intervention.technicien.first_name}
            lastName={intervention.technicien.last_name}
            size="md"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">
              {intervention.technicien.first_name} {intervention.technicien.last_name}
            </p>
            {intervention.technicien.telephone && (
              <p className="text-xs text-ink-soft">{intervention.technicien.telephone}</p>
            )}
          </div>
        </div>
      </div>
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