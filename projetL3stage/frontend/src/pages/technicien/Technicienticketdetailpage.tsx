import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, CheckCircle2, MessageSquare, FileText,
  Activity, Download,  Wrench,
  AlertTriangle, Search, Trash2, Package, Calendar,
  Stethoscope,
  Info,
  Clock,

} from 'lucide-react';
import {
  getMesAffectations,
  getInterventionDuTicket,
  creerIntervention,
  ajouterPieceUtilisee,
  terminerInterventionAvecTemps,
  mettreAJourDiagnostic,
  getCataloguePieces,
  getHistoriqueTicket,
  getCommentaires,
  telechargerRapportPDF,
  getPlanificationActive,
  type PieceCatalogue,
  type InterventionDiagnosticData,
  type HistoriqueEntry,
  type Commentaire,
  type Planification,
} from '../../api/ticketService';
import type {
  TicketTechnicien,
  InterventionSuivi,
  PieceUtiliseeCreateData,
} from '../../types/ticket';
import { formatDate, formatDateTime as formatDateTimeUtil, formatReference } from '../../utils/ticketDisplay';
import {
  validateDiagnostic,
  validateNomPiece,
  validateQuantiteVsStock,
  validatePrix,
  validateTempsPasse,
  DIAGNOSTIC_MAX,
  
} from '../../utils/validators';
import AppShell from '../../components/layout/AppShell';
import Tabs, { type TabItem } from '../../components/ui/Tabs';
import Timeline, { type TimelineItem } from '../../components/ui/Timeline';
import Stepper, { type Step } from '../../components/ui/Stepper';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/input';
import Textarea from '../../components/ui/Texterea';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { StatusBadge, InterventionStatusBadge } from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import UserAvatar from '../../components/ui/UserAvatar';
import SLABadge from '../../components/ui/SLABadge';
import { useToast } from '../../context/ToastContext';
import PieceDemandeeSection from '../../components/smart-ticket/PieceDemandeeSection';
import CommentairesSection from '../../components/smart-ticket/CommentairesSection';
import { soumettreDiagnostic } from '../../api/ticketService';

type TabId = 'overview' | 'diagnostic' | 'pieces_demandees' | 'intervention' | 'pieces' | 'comments';

const ETAPES: Step[] = [
  { id: 'affecte', label: 'Affecté' },
  { id: 'diagnostic', label: 'Diagnostic' },
  { id: 'devis', label: 'Devis' },
  { id: 'intervention', label: 'Intervention' },
  { id: 'termine', label: 'Terminé' },
];

function getEtapeIndex(statut: string): number {
  switch (statut) {
    case 'AFFECTE':
      return 0;
    case 'A_QUALIFIER':
      return 1;
    case 'EN_ATTENTE':
      return 2;
    case 'EN_COURS':
      return 3;
    case 'RESOLU':
    case 'CLOTURE':
      return 4;
    default:
      return 0;
  }
}

export default function TechnicienTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const ticketId = Number(id);

  const [ticket, setTicket] = useState<TicketTechnicien | null>(null);
  const [intervention, setIntervention] = useState<InterventionSuivi | null>(null);
  const [catalogue, setCatalogue] = useState<PieceCatalogue[]>([]);
  const [historique, setHistorique] = useState<HistoriqueEntry[]>([]);
  const [, setCommentaires] = useState<Commentaire[]>([]);
  const [planification, setPlanification] = useState<Planification | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const [diagnosticInitial, setDiagnosticInitial] = useState('');
  const [creationEnCours, setCreationEnCours] = useState(false);

  const [diag, setDiag] = useState<InterventionDiagnosticData>({});
  const [diagEnCours, setDiagEnCours] = useState(false);

  const [ajouterPieceOpen, setAjouterPieceOpen] = useState(false);
  const [rechercheCatalogue, setRechercheCatalogue] = useState('');
  const [pieceChoisie, setPieceChoisie] = useState<PieceCatalogue | null>(null);
  const [pieceLibre, setPieceLibre] = useState(false);
  const [pieceNom, setPieceNom] = useState('');
  const [pieceRef, setPieceRef] = useState('');
  const [pieceQte, setPieceQte] = useState(1);
  const [piecePrix, setPiecePrix] = useState(100);
  const [pieceEnCours, setPieceEnCours] = useState(false);

  const [terminerOpen, setTerminerOpen] = useState(false);
  const [tempsPasse, setTempsPasse] = useState<number | ''>('');
  const [terminaisonEnCours, setTerminaisonEnCours] = useState(false);

  const [] = useState('');
  const [] = useState<'PUBLIC' | 'INTERNE'>('PUBLIC');
  const [] = useState(false);

  const [pdfEnCours, setPdfEnCours] = useState(false);
  const [soumissionEnCours, setSoumissionEnCours] = useState(false);

  const charger = async () => {
    setLoading(true);
    try {
      const [affectations, interventionData, catalogueData, histoData, commData, planifData] =
        await Promise.all([
          getMesAffectations(),
          getInterventionDuTicket(ticketId).catch(() => null),
          getCataloguePieces().catch(() => []),
          getHistoriqueTicket(ticketId).catch(() => []),
          getCommentaires(ticketId).catch(() => []),
          getPlanificationActive(ticketId).catch(() => null),
        ]);

      const foundTicket = affectations.find((t) => t.id === ticketId) ?? null;
      setTicket(foundTicket);
      setIntervention(interventionData);
      setCatalogue(catalogueData);
      setHistorique(histoData);
      setCommentaires(commData);
      setPlanification(planifData);

      if (interventionData) {
        setDiag({
          symptomes_constates: interventionData.symptomes_constates || '',
          tests_effectues: interventionData.tests_effectues || '',
          cause_probable: interventionData.cause_probable || '',
          cause_confirmee: interventionData.cause_confirmee || '',
          resultat_intervention: interventionData.resultat_intervention || '',
          checklist_securite: interventionData.checklist_securite || [],
        });
      }
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

  const timelineItems: TimelineItem[] = useMemo(() => {
    return historique.map((h) => ({
      id: h.id,
      title: h.champ_modifie_display,
      description: h.justification
        ? `${h.ancienne_valeur || '∅'} → ${h.nouvelle_valeur} — ${h.justification}`
        : `${h.ancienne_valeur || '∅'} → ${h.nouvelle_valeur}`,
      date: formatDateTimeUtil(h.date),
      variant: h.champ_modifie === 'STATUT' ? 'primary' : 'default',
    }));
  }, [historique]);

  const catalogueFiltre = useMemo(() => {
    if (!rechercheCatalogue.trim()) return catalogue.slice(0, 20);
    const q = rechercheCatalogue.toLowerCase();
    return catalogue
      .filter(
        (p) =>
          p.designation.toLowerCase().includes(q) ||
          p.reference.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [catalogue, rechercheCatalogue]);

  const handleCreerIntervention = async (e: FormEvent) => {
    e.preventDefault();
    const err = validateDiagnostic(diagnosticInitial);
    if (err) return toast.error('Diagnostic invalide', err);

    setCreationEnCours(true);
    try {
      await creerIntervention(ticketId, { diagnostic: diagnosticInitial });
      toast.success('Intervention démarrée', '');
      setDiagnosticInitial('');
      await charger();
      setActiveTab('diagnostic');
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || 'Impossible de créer.');
    } finally {
      setCreationEnCours(false);
    }
  };

  const handleSauverDiagnostic = async () => {
    if (!intervention) return;
    setDiagEnCours(true);
    try {
      await mettreAJourDiagnostic(intervention.id, diag);
      toast.success('Diagnostic enregistré', '');
      await charger();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || "Impossible d'enregistrer.");
    } finally {
      setDiagEnCours(false);
    }
  };

  const resetPieceForm = () => {
    setPieceChoisie(null);
    setPieceLibre(false);
    setPieceNom('');
    setPieceRef('');
    setPieceQte(1);
    setPiecePrix(100);
    setRechercheCatalogue('');
  };

  const handleAjouterPiece = async (e: FormEvent) => {
    e.preventDefault();
    if (!intervention) return;

    let data: PieceUtiliseeCreateData;

    if (pieceChoisie) {
      const err = validateQuantiteVsStock(pieceQte, pieceChoisie.stock_actuel);
      if (err) return toast.error('Quantité invalide', err);
      data = { piece: pieceChoisie.id, quantite: pieceQte };
    } else {
      const errNom = validateNomPiece(pieceNom);
      if (errNom) return toast.error('Nom invalide', errNom);

      const errPrix = validatePrix(piecePrix);
      if (errPrix) return toast.error('Prix invalide', errPrix);

      data = {
        nom: pieceNom,
        reference: pieceRef,
        quantite: pieceQte,
        prix_unitaire: piecePrix,
      };
    }

    setPieceEnCours(true);
    try {
      await ajouterPieceUtilisee(intervention.id, data);
      toast.success('Pièce ajoutée', '');
      setAjouterPieceOpen(false);
      resetPieceForm();
      await charger();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || "Impossible d'ajouter.");
    } finally {
      setPieceEnCours(false);
    }
  };

  const handleTerminer = async () => {
  if (!intervention) return;

  if (tempsPasse !== '' && tempsPasse !== null) {
    const err = validateTempsPasse(tempsPasse);
    if (err) return toast.error('Temps invalide', err);
  }

  setTerminaisonEnCours(true);
  try {
    await terminerInterventionAvecTemps(
      intervention.id,
      tempsPasse === '' ? undefined : Number(tempsPasse)
    );

    // 1️⃣ Ferme la modale immédiatement
    setTerminerOpen(false);
    setTempsPasse('');
    toast.success('Intervention terminée', 'En attente de validation client.');

    // 2️⃣ Recharge l'intervention en priorité
    const nouvelleIntervention = await getInterventionDuTicket(ticketId);
    setIntervention(nouvelleIntervention);

    // 3️⃣ Recharge le reste en arrière-plan
    await charger();
  } catch (err: any) {
    toast.error('Erreur', err?.response?.data?.detail || 'Impossible de terminer.');
  } finally {
    setTerminaisonEnCours(false);
  }
};


  const handleDownloadPDF = async () => {
    if (!intervention) return;
    setPdfEnCours(true);
    try {
      await telechargerRapportPDF(intervention.id, true);
      toast.success('PDF téléchargé', '');
    } catch {
      toast.error('Erreur', 'Impossible de télécharger.');
    } finally {
      setPdfEnCours(false);
    }
  };
const handleSoumettreDiagnostic = async () => {
  if (!intervention) return;
  if (!confirm('Soumettre le diagnostic ? Il ne sera plus modifiable.')) return;

  setSoumissionEnCours(true);
  try {
    await soumettreDiagnostic(intervention.id);
    toast.success('Diagnostic soumis', "L'Admin a été notifié pour établir le devis.");
    await charger();
  } catch (err: any) {
    toast.error('Erreur', err?.response?.data?.detail || 'Impossible de soumettre.');
  } finally {
    setSoumissionEnCours(false);
  }
};
  const toggleChecklist = (item: string) => {
    const current = diag.checklist_securite || [];
    const next = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    setDiag({ ...diag, checklist_securite: next });
  };

 const tabs: TabItem[] = [
  { id: 'overview', label: "Vue d'ensemble", icon: <FileText size={14} /> },
  {
    id: 'diagnostic',
    label: 'Diagnostic',
    icon: <Stethoscope size={14} />,  // ← NOUVEAU
  },
  {
    id: 'pieces_demandees',
    label: 'Pièces nécessaires',
    icon: <Package size={14} />,
    // Seulement visible en phase diagnostic
  },
  {
    id: 'intervention',
    label: 'Intervention',
    icon: <Wrench size={14} />,  // ← NOUVEAU
  },
  {
    id: 'pieces',
    label: 'Pièces utilisées',
    icon: <Package size={14} />,
    badge: intervention?.pieces_utilisees?.length ?? 0,
  },
  {
    id: 'comments',
    label: 'Commentaires',
    icon: <MessageSquare size={14} />,
  },
];

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
        <div className="p-6 max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/smart-ticket/technicien/tickets')}
            className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink mb-4"
          >
            <ArrowLeft size={16} /> Mes interventions
          </button>
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<AlertTriangle size={32} />}
              title="Ticket introuvable"
              description="Ce ticket ne vous est pas affecté, ou il n'existe plus. Vérifiez qu'il n'a pas été réaffecté à un autre technicien."
              action={
                <Button
                  icon={<ArrowLeft size={15} />}
                  onClick={() => navigate('/smart-ticket/technicien/tickets')}
                >
                  Retour à mes interventions
                </Button>
              }
            />
          </div>
        </div>
      </AppShell>
    );
  }

  const etapeIndex = getEtapeIndex(ticket.statut);
  const coutTotalPieces = (intervention?.pieces_utilisees ?? []).reduce(
    (total, p) => total + p.cout_total,
    0
  );

  return (
    <AppShell
      title={formatReference(ticket.id)}
      breadcrumb={['NjCam', 'Technicien', 'Mes interventions', formatReference(ticket.id)]}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        <button
          onClick={() => navigate('/smart-ticket/technicien/tickets')}
          className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={16} /> Mes interventions
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

          <div className="pt-4 border-t border-line">
            <Stepper steps={ETAPES} current={etapeIndex} />
          </div>
        </div>

        {/* Planification visible */}
        {planification && planification.statut === 'PLANIFIEE' && (
          <div className="bg-info-soft border border-info/30 rounded-lg p-4 flex items-start gap-3">
            <Calendar size={18} className="text-info shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink mb-1">
                Intervention planifiée
              </p>
              <p className="text-sm text-ink-soft">
                {formatDate(planification.date)} — de {planification.heure_debut} à{' '}
                {planification.heure_fin} ({planification.duree_estimee_minutes} min)
              </p>
            </div>
          </div>
        )}

        {/* Actions rapides */}
       {intervention && (
  <div className="flex flex-wrap gap-2">
    {/* Soumettre le diagnostic : seulement si ticket AFFECTE (avant devis) */}
    {intervention.statut === 'EN_COURS' && ticket?.statut === 'AFFECTE' && (
      <Button
        variant="success"
        icon={<CheckCircle2 size={15} />}
        onClick={handleSoumettreDiagnostic}
        loading={soumissionEnCours}
      >
        Soumettre le diagnostic
      </Button>
    )}

    {/* Terminer l'intervention : seulement si devis accepté (ticket EN_COURS) */}
    {intervention.statut === 'EN_COURS' && ticket?.statut === 'EN_COURS' && (
      <Button
        variant="success"
        icon={<CheckCircle2 size={15} />}
        onClick={() => setTerminerOpen(true)}
      >
        Terminer l'intervention
      </Button>
    )}

    {intervention.rapport && (
      <Button
        variant="secondary"
        icon={<Download size={15} />}
        onClick={handleDownloadPDF}
        loading={pdfEnCours}
      >
        Télécharger le rapport PDF
      </Button>
    )}
  </div>
)}

        <Tabs tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

        {activeTab === 'overview' && <OverviewTab ticket={ticket} />}

        {activeTab === 'diagnostic' && (
          <DiagnosticTab
            intervention={intervention}
            diagnosticInitial={diagnosticInitial}
            setDiagnosticInitial={setDiagnosticInitial}
            creationEnCours={creationEnCours}
            handleCreerIntervention={handleCreerIntervention}
            diag={diag}
            setDiag={setDiag}
            diagEnCours={diagEnCours}
            handleSauverDiagnostic={handleSauverDiagnostic}
            toggleChecklist={toggleChecklist}
          />
        )}
     {activeTab === 'pieces_demandees' && (
  intervention ? (
    <PieceDemandeeSection
      interventionId={intervention.id}
      editable={intervention.statut === 'EN_COURS' && ticket?.statut === 'AFFECTE'}
      onChange={charger}
    />
  ) : (
    <div className="bg-card border border-line rounded-lg p-6 text-center text-sm text-ink-soft">
      Démarrez d'abord l'intervention pour ajouter des pièces.
    </div>
  )
)}
{activeTab === 'intervention' && (
  <InterventionTab
    intervention={intervention}
    tempsPasse={tempsPasse}
    setTempsPasse={setTempsPasse}
    terminerEnCours={terminaisonEnCours}
    onTerminer={() => setTerminerOpen(true)}
  />
)}

        {activeTab === 'pieces' && (
          <PiecesTab
            intervention={intervention}
            coutTotalPieces={coutTotalPieces}
            onAjouter={() => setAjouterPieceOpen(true)}
          />
        )}

       {activeTab === 'comments' && ticket && (
  <CommentairesSection ticketId={ticket.id} role="TECHNICIEN" />
)}

        {/* Historique */}
        {historique.length > 0 && (
          <div className="bg-card border border-line rounded-lg p-6">
            <h3 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
              <Activity size={16} /> Activité récente
            </h3>
            <Timeline items={timelineItems} />
          </div>
        )}
      </div>

      {/* Modale Ajouter pièce */}
      <Modal
        open={ajouterPieceOpen}
        onClose={() => {
          setAjouterPieceOpen(false);
          resetPieceForm();
        }}
        title="Ajouter une pièce"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setAjouterPieceOpen(false);
                resetPieceForm();
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleAjouterPiece} loading={pieceEnCours} icon={<Plus size={15} />}>
              Ajouter
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPieceLibre(false);
                setPieceChoisie(null);
              }}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                !pieceLibre ? 'bg-primary text-white' : 'bg-surface text-ink-soft hover:bg-line'
              }`}
            >
              Catalogue
            </button>
            <button
              type="button"
              onClick={() => {
                setPieceLibre(true);
                setPieceChoisie(null);
              }}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pieceLibre ? 'bg-primary text-white' : 'bg-surface text-ink-soft hover:bg-line'
              }`}
            >
              Pièce libre
            </button>
          </div>

          {!pieceLibre && !pieceChoisie && (
            <div className="space-y-3">
              <Input
                placeholder="Rechercher par référence ou désignation…"
                value={rechercheCatalogue}
                onChange={(e) => setRechercheCatalogue(e.target.value)}
                icon={<Search size={15} />}
              />
              <div className="border border-line rounded-md max-h-64 overflow-y-auto divide-y divide-line">
                {catalogueFiltre.length === 0 ? (
                  <p className="text-sm text-ink-soft text-center py-6">Aucune pièce trouvée.</p>
                ) : (
                  catalogueFiltre.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPieceChoisie(p);
                        setPieceQte(1);
                      }}
                      disabled={p.stock_actuel === 0}
                      className="w-full text-left px-3 py-2.5 hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-ink truncate">{p.designation}</p>
                          <p className="text-xs text-ink-soft">
                            Réf. {p.reference} • Stock : {p.stock_actuel}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-ink shrink-0">
                          {p.prix_unitaire.toLocaleString('fr-FR')} Ar
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {!pieceLibre && pieceChoisie && (
            <div className="bg-surface rounded-md p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{pieceChoisie.designation}</p>
                  <p className="text-xs text-ink-soft">
                    Réf. {pieceChoisie.reference} • Stock : {pieceChoisie.stock_actuel}
                  </p>
                </div>
                <button
                  onClick={() => setPieceChoisie(null)}
                  className="p-1 rounded text-ink-soft hover:bg-line"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <Input
                type="number"
                label="Quantité"
                value={pieceQte}
                min={1}
                max={pieceChoisie.stock_actuel}
                onChange={(e) => setPieceQte(Number(e.target.value))}
              />
              <p className="text-sm font-medium text-ink">
                Total : {(pieceQte * pieceChoisie.prix_unitaire).toLocaleString('fr-FR')} Ar
              </p>
            </div>
          )}

          {pieceLibre && (
            <div className="space-y-3">
              <Input
                label="Nom de la pièce"
                value={pieceNom}
                onChange={(e) => setPieceNom(e.target.value)}
                placeholder="Ex : Filtre à air"
              />
              <Input
                label="Référence (optionnel)"
                value={pieceRef}
                onChange={(e) => setPieceRef(e.target.value)}
                placeholder="Ex : REF-2025-001"
              />
              <Input
                type="number"
                label="Quantité"
                value={pieceQte}
                min={1}
                max={999}
                onChange={(e) => setPieceQte(Number(e.target.value))}
              />
              <Input
                type="number"
                label="Prix unitaire (Ar)"
                value={piecePrix}
                min={100}
                step={100}
                onChange={(e) => setPiecePrix(Number(e.target.value))}
                hint="Minimum 100 Ar"
              />
              <p className="text-sm font-medium text-ink">
                Total : {(pieceQte * piecePrix).toLocaleString('fr-FR')} Ar
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Modale Terminer */}
      <Modal
        open={terminerOpen}
        onClose={() => setTerminerOpen(false)}
        title="Terminer l'intervention"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTerminerOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="success"
              onClick={handleTerminer}
              loading={terminaisonEnCours}
              icon={<CheckCircle2 size={15} />}
            >
              Terminer et générer le rapport
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-warning-soft border border-warning/30 rounded-md p-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
            <div className="text-xs text-warning">
              <p className="font-medium mb-1">Action irréversible</p>
              <p>
                Une fois terminée, l'intervention ne peut plus être modifiée. Un rapport sera
                généré automatiquement et le client devra valider.
              </p>
            </div>
          </div>

          <Input
            type="number"
            label="Temps passé (minutes) — optionnel"
            value={tempsPasse === '' ? '' : tempsPasse}
            min={1}
            max={1440}
            onChange={(e) => setTempsPasse(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Ex : 45"
            hint="Entre 1 et 1440 minutes (24h max)"
          />
        </div>
      </Modal>
    </AppShell>
  );
}

// ============================================
// SOUS-COMPOSANTS
// ============================================

function OverviewTab({ ticket }: { ticket: TicketTechnicien }) {
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
          </dl>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-card border border-line rounded-lg p-6">
          <h3 className="text-sm font-semibold text-ink mb-3">Client</h3>
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
          <h3 className="text-sm font-semibold text-ink mb-3">Métadonnées</h3>
          <dl className="space-y-2 text-sm">
            <InfoRow label="Créé le" value={formatDate(ticket.date_creation)} />
            {ticket.sla_deadline && (
              <InfoRow label="Échéance SLA" value={formatDateTimeUtil(ticket.sla_deadline)} />
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}

function DiagnosticTab({
  intervention,
  diagnosticInitial,
  setDiagnosticInitial,
  creationEnCours,
  handleCreerIntervention,
  diag,
  setDiag,
  diagEnCours,
  handleSauverDiagnostic,

}: {
  intervention: InterventionSuivi | null;
  diagnosticInitial: string;
  setDiagnosticInitial: (v: string) => void;
  creationEnCours: boolean;
  handleCreerIntervention: (e: FormEvent) => void;
  diag: InterventionDiagnosticData;
  setDiag: (d: InterventionDiagnosticData) => void;
  diagEnCours: boolean;
  handleSauverDiagnostic: () => void;
  toggleChecklist: (item: string) => void;
}) {
  if (!intervention) {
    return (
      <div className="bg-card border border-line rounded-lg p-6">
        <h3 className="text-base font-semibold text-ink mb-4">Démarrer l'intervention</h3>
        <form onSubmit={handleCreerIntervention} className="space-y-4">
          <Textarea
            label="Diagnostic initial"
            value={diagnosticInitial}
            onChange={(e) => setDiagnosticInitial(e.target.value)}
            rows={4}
            placeholder="Décrivez le diagnostic initial (10 caractères min)…"
            hint={`${diagnosticInitial.length} / ${DIAGNOSTIC_MAX}`}
          />
          <Button type="submit" loading={creationEnCours} fullWidth>
            Démarrer l'intervention
          </Button>
        </form>
      </div>
    );
  }

  const readOnly = intervention.statut !== 'EN_COURS';
  

  return (
    <div className="space-y-5">
      <div className="bg-card border border-line rounded-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-ink">Diagnostic enrichi</h3>
          <InterventionStatusBadge statut={intervention.statut} />
        </div>

        {readOnly && (
          <div className="bg-surface rounded-md p-3 text-xs text-ink-soft">
            L'intervention n'est plus modifiable (statut : {intervention.statut}).
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-1">
            Diagnostic initial
          </p>
          <p className="text-sm text-ink whitespace-pre-wrap bg-surface rounded-md p-3">
            {intervention.diagnostic}
          </p>
        </div>

        <Textarea
          label="Symptômes constatés"
          value={diag.symptomes_constates || ''}
          onChange={(e) => setDiag({ ...diag, symptomes_constates: e.target.value })}
          rows={3}
          placeholder="Décrivez les symptômes observés…"
          disabled={readOnly}
        />

        <Textarea
          label="Tests effectués"
          value={diag.tests_effectues || ''}
          onChange={(e) => setDiag({ ...diag, tests_effectues: e.target.value })}
          rows={3}
          placeholder="Listez les tests de diagnostic réalisés…"
          disabled={readOnly}
        />

      
        <Textarea
          label="Résultat de l'intervention"
          value={diag.resultat_intervention || ''}
          onChange={(e) => setDiag({ ...diag, resultat_intervention: e.target.value })}
          rows={3}
          placeholder="Décrivez les actions correctives réalisées et le résultat…"
          disabled={readOnly}
        />

        
        {!readOnly && (
          <div className="flex justify-end pt-2">
            <Button onClick={handleSauverDiagnostic} loading={diagEnCours}>
              Enregistrer le diagnostic
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
 function InterventionTab({
  intervention,
  tempsPasse,
  setTempsPasse,
  terminerEnCours,
  onTerminer,
}: {
  intervention: InterventionSuivi | null;
  tempsPasse: number | '';
  setTempsPasse: (v: number | '') => void;
  terminerEnCours: boolean;
  onTerminer: () => void;
}) {
  if (!intervention) {
    return (
      <div className="bg-card border border-line rounded-lg p-6 text-center text-sm text-ink-soft">
        Aucune intervention en cours. Le diagnostic doit d'abord être soumis et le devis accepté.
      </div>
    );
  }

  const peutTerminer = intervention.statut === 'EN_COURS';

  return (
    <div className="space-y-5">
      <div className="bg-card border border-line rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-ink flex items-center gap-2">
            <Wrench size={18} /> Intervention technique
          </h3>
          <InterventionStatusBadge statut={intervention.statut} />
        </div>

        <p className="text-sm text-ink-soft">
          Le devis a été accepté. Procédez à la réparation, saisissez les pièces utilisées
          et le temps passé, puis terminez l'intervention.
        </p>

        <div className="bg-info-soft border border-info/30 rounded-md p-3 text-xs text-info flex items-start gap-2">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>
            Les <strong>pièces utilisées</strong> sont à saisir dans l'onglet "Pièces utilisées".
            Le stock sera automatiquement décrémenté.
          </span>
        </div>
      </div>

      {peutTerminer && (
        <div className="bg-success-soft border border-success/30 rounded-lg p-5 space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-success shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink mb-1">
                Terminer l'intervention
              </p>
              <p className="text-xs text-ink-soft mb-3">
                Un rapport sera généré automatiquement. Le client devra ensuite valider.
              </p>
            </div>
          </div>

          <Input
            type="number"
            label="Temps passé (minutes) — optionnel"
            value={tempsPasse === '' ? '' : tempsPasse}
            min={1}
            max={1440}
            onChange={(e) => setTempsPasse(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Ex : 45"
            hint="Entre 1 et 1440 minutes (24h max)"
          />

          <Button
            variant="success"
            icon={<CheckCircle2 size={15} />}
            onClick={onTerminer}
            loading={terminerEnCours}
            fullWidth
          >
            Terminer et générer le rapport
          </Button>
        </div>
      )}

      {intervention.statut === 'TERMINEE' && (
        <div className="bg-warning-soft border border-warning/30 rounded-lg p-4 flex items-center gap-3">
          <Clock size={18} className="text-warning shrink-0" />
          <p className="text-sm text-warning font-medium">
            Intervention terminée — En attente de validation par le client
          </p>
        </div>
      )}

      {intervention.statut === 'VALIDEE' && (
        <div className="bg-success-soft border border-success/30 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-success shrink-0" />
          <p className="text-sm text-success font-medium">
            Intervention validée — Ticket clôturé
          </p>
        </div>
      )}
    </div>
  );
}

function PiecesTab({
  intervention,
  coutTotalPieces,
  onAjouter,
}: {
  intervention: InterventionSuivi | null;
  coutTotalPieces: number;
  onAjouter: () => void;
}) {
  if (!intervention) {
    return (
      <div className="bg-card border border-line rounded-lg p-6">
        <EmptyState
          icon={<Package size={32} />}
          title="Intervention non démarrée"
          description="Vous devez d'abord démarrer l'intervention pour ajouter des pièces."
        />
      </div>
    );
  }

  const pieces = intervention.pieces_utilisees || [];
  const readOnly = intervention.statut !== 'EN_COURS';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink">Pièces utilisées</h3>
          <p className="text-xs text-ink-soft">
            Cout total pièces : {coutTotalPieces.toLocaleString('fr-FR')} Ar
          </p>
        </div>
        {!readOnly && (
          <Button icon={<Plus size={15} />} onClick={onAjouter}>
            Ajouter une pièce
          </Button>
        )}
      </div>

      {pieces.length === 0 ? (
        <div className="bg-card border border-line rounded-lg p-6">
          <EmptyState
            icon={<Package size={32} />}
            title="Aucune pièce enregistrée"
            description="Aucune pièce n'a encore été ajoutée à cette intervention."
          />
        </div>
      ) : (
        <div className="bg-card border border-line rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface border-b border-line text-xs font-semibold text-ink-soft uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Désignation</th>
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3 text-right">Quantité</th>
                <th className="px-4 py-3 text-right">Prix Unitaire</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pieces.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-ink">{p.nom}</td>
                  <td className="px-4 py-3 text-ink-soft">{p.reference || '—'}</td>
                  <td className="px-4 py-3 text-right text-ink">{p.quantite}</td>
                  <td className="px-4 py-3 text-right text-ink-soft">
                    {p.prix_unitaire.toLocaleString('fr-FR')} Ar
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-ink">
                    {p.cout_total.toLocaleString('fr-FR')} Ar
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-ink-soft uppercase tracking-wide">{label}</dt>
      <dd className="text-sm font-medium text-ink mt-0.5">{value}</dd>
    </div>
  );
}