import { type FormEvent, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Package, MapPin, Camera,
  Check, X, Clock, MessageSquare, Send, Lock
  , AlertTriangle, CheckCircle2,
} from 'lucide-react';
import {
  getMesDemandes,
  repondreDevis,
  getCommentairesDemande,
  ajouterCommentaireDemande,
} from '../../../api/camtrackService';
import type {
  DemandeClient,
  Commentaire,
  StatutDemande,
} from '../../../types/camtrack';
import AppShell from '../../../components/layout/AppShell';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Textarea from '../../../components/ui/Texterea';
import Modal from '../../../components/ui/Modal';
import EmptyState from '../../../components/ui/EmptyState';
import UserAvatar from '../../../components/ui/UserAvatar';
import { useToast } from '../../../context/ToastContext';

const STATUT_CONFIG: Record<
  StatutDemande,
  { label: string; variant: 'warning' | 'success' | 'danger' }
> = {
  EN_ATTENTE: { label: 'En attente', variant: 'warning' },
  VALIDEE: { label: 'Validée', variant: 'success' },
  REJETEE: { label: 'Rejetée', variant: 'danger' },
};

export default function DemandeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const demandeId = Number(id);

  const [demande, setDemande] = useState<DemandeClient | null>(null);
  const [commentaires, setCommentaires] = useState<Commentaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionEnCours, setActionEnCours] = useState(false);

  // Devis actions
  const [confirmAccepter, setConfirmAccepter] = useState(false);
  const [confirmRefuser, setConfirmRefuser] = useState(false);

  // Commentaire
  const [nouveauCommentaire, setNouveauCommentaire] = useState('');
  const [commentaireEnCours, setCommentaireEnCours] = useState(false);

  const charger = async () => {
    setLoading(true);
    try {
      const [demandes, comms] = await Promise.all([
        getMesDemandes(),
        getCommentairesDemande(demandeId).catch(() => []),
      ]);
      const found = demandes.find((d) => d.id === demandeId) || null;
      setDemande(found);
      setCommentaires(comms);
    } catch {
      toast.error('Erreur', 'Impossible de charger la demande.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demandeId]);

  const handleRepondreDevis = async (accepte: boolean) => {
    if (!demande?.devis) return;
    setActionEnCours(true);
    try {
      await repondreDevis(demande.devis.id, { accepte });
      await charger();
      setConfirmAccepter(false);
      setConfirmRefuser(false);
      toast.success(
        accepte ? 'Devis accepté' : 'Devis refusé',
        accepte
          ? 'Un technicien va être affecté à votre site.'
          : 'Votre demande a été clôturée.'
      );
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || 'Action impossible.');
    } finally {
      setActionEnCours(false);
    }
  };

  const handleEnvoyerCommentaire = async (e: FormEvent) => {
    e.preventDefault();
    if (!nouveauCommentaire.trim() || nouveauCommentaire.trim().length < 2) {
      toast.error('Commentaire invalide', 'Minimum 2 caractères.');
      return;
    }
    setCommentaireEnCours(true);
    try {
      const c = await ajouterCommentaireDemande(demandeId, {
        contenu: nouveauCommentaire.trim(),
        visibilite: 'PUBLIC',
      });
      setCommentaires((prev) => [...prev, c]);
      setNouveauCommentaire('');
      toast.success('Commentaire ajouté', '');
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || "Impossible d'envoyer.");
    } finally {
      setCommentaireEnCours(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Demande">
        <div className="p-6 text-ink-soft">Chargement…</div>
      </AppShell>
    );
  }

  if (!demande) {
    return (
      <AppShell title="Demande">
        <div className="p-6 max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/camtrack/client/demandes')}
            className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink mb-4"
          >
            <ArrowLeft size={16} /> Mes demandes
          </button>
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<AlertTriangle size={32} />}
              title="Demande introuvable"
              action={
                <Button onClick={() => navigate('/camtrack/client/demandes')}>
                  Retour
                </Button>
              }
            />
          </div>
        </div>
      </AppShell>
    );
  }

  const conf = STATUT_CONFIG[demande.statut];
  const devis = demande.devis;
  const peutRepondreDevis = devis && demande.statut === 'EN_ATTENTE';

  return (
    <AppShell
      title={`DEM-${String(demande.id).padStart(5, '0')}`}
      breadcrumb={['NjCam', 'CamTrack', 'Mes demandes', `DEM-${demande.id}`]}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        <button
          onClick={() => navigate('/camtrack/client/demandes')}
          className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={16} /> Mes demandes
        </button>

        {/* En-tête */}
        <div className="bg-card border border-line rounded-lg p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant={conf.variant} dot>{conf.label}</Badge>
                <span className="text-xs text-ink-soft">
                  Soumise le {new Date(demande.date_soumission).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <h1 className="text-xl font-semibold text-ink mb-1">
                {demande.offre.nom}
              </h1>
              <p className="text-sm text-ink-soft">{demande.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-4">
            {/* Offre */}
            <div className="bg-card border border-line rounded-lg p-6">
              <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                <Package size={16} /> Offre choisie
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-ink">{demande.offre.nom}</p>
                <p className="text-ink-soft">{demande.offre.description}</p>
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div>
                    <p className="text-xs text-ink-soft">Caméras incluses</p>
                    <p className="text-ink font-medium">
                      {demande.offre.nombre_cameras_inclus}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-soft">Abonnement</p>
                    <p className="text-ink font-medium">
                      {demande.offre.prix_abonnement.toLocaleString('fr-FR')} Ar/mois
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sites */}
            {demande.sites.length > 0 && (
              <div className="bg-card border border-line rounded-lg p-6">
                <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                  <MapPin size={16} /> Site{demande.sites.length > 1 ? 's' : ''}
                </h3>
                <div className="space-y-3">
                  {demande.sites.map((site) => (
                    <div
                      key={site.id}
                      className="bg-surface rounded-md p-3 space-y-2"
                    >
                      <p className="text-sm font-medium text-ink">{site.nom}</p>
                      <p className="text-xs text-ink-soft">{site.adresse}</p>
                      {site.statut === 'VALIDE' && (
                        <Badge variant="success" size="sm">
                          <Check size={10} /> Site validé
                        </Badge>
                      )}
                      {site.fichiers.length > 0 && (
                        <div className="pt-2 border-t border-line">
                          <p className="text-xs text-ink-soft mb-2">
                            {site.fichiers.length} fichier{site.fichiers.length > 1 ? 's' : ''}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {site.fichiers.slice(0, 6).map((f) => (
                              <a
                                key={f.id}
                                href={f.fichier}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-2 py-1 bg-card border border-line rounded text-xs hover:border-primary/40 transition-colors"
                              >
                                <Camera size={12} className="text-primary" />
                                <span className="truncate max-w-[120px]">
                                  {f.fichier.split('/').pop()}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Devis */}
            {devis && (
              <div className="bg-card border border-line rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                    <FileText size={16} /> Devis
                  </h3>
                  <span className="text-xs text-ink-soft">
                    Établi le{' '}
                    {new Date(devis.date_etablissement).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <div className="border border-line rounded-md divide-y divide-line mb-4">
                  {devis.lignes.map((ligne) => (
                    <div
                      key={ligne.id}
                      className="flex items-center justify-between px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="text-ink">{ligne.designation}</p>
                        <p className="text-xs text-ink-soft">
                          {ligne.quantite} × {ligne.prix_unitaire.toLocaleString('fr-FR')} Ar
                        </p>
                      </div>
                      <span className="text-ink font-medium">
                        {ligne.total.toLocaleString('fr-FR')} Ar
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3 py-3 bg-surface">
                    <span className="text-sm font-semibold text-ink">Total</span>
                    <span className="text-base font-bold text-primary">
                      {devis.montant.toLocaleString('fr-FR')} Ar
                    </span>
                  </div>
                </div>

                {peutRepondreDevis && (
                  <div className="flex gap-2">
                    <Button
                      variant="danger"
                      icon={<X size={15} />}
                      onClick={() => setConfirmRefuser(true)}
                      disabled={actionEnCours}
                    >
                      Refuser
                    </Button>
                    <Button
                      variant="success"
                      icon={<Check size={15} />}
                      onClick={() => setConfirmAccepter(true)}
                      disabled={actionEnCours}
                      fullWidth
                    >
                      Accepter le devis
                    </Button>
                  </div>
                )}

                {demande.statut === 'VALIDEE' && (
                  <div className="bg-success-soft border border-success/30 rounded-md p-3 flex items-center gap-2 text-success text-sm">
                    <CheckCircle2 size={16} /> Devis accepté — installation en préparation
                  </div>
                )}
                {demande.statut === 'REJETEE' && (
                  <div className="bg-danger-soft border border-danger/30 rounded-md p-3 flex items-center gap-2 text-danger text-sm">
                    <X size={16} /> Devis refusé
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-4">
            {/* Statut */}
            <div className="bg-card border border-line rounded-lg p-6">
              <h3 className="text-sm font-semibold text-ink mb-3">Statut</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-ink-soft" />
                  <span className="text-ink-soft">Demande créée</span>
                </div>
                {devis && (
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-ink-soft" />
                    <span className="text-ink-soft">Devis envoyé</span>
                  </div>
                )}
                {demande.statut === 'VALIDEE' && (
                  <div className="flex items-center gap-2 text-success">
                    <Check size={14} />
                    <span>Devis accepté</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Commentaires */}
        <div className="bg-card border border-line rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
            <MessageSquare size={16} /> Commentaires ({commentaires.length})
          </h3>

          <form onSubmit={handleEnvoyerCommentaire} className="space-y-3">
            <Textarea
              value={nouveauCommentaire}
              onChange={(e) => setNouveauCommentaire(e.target.value)}
              rows={3}
              placeholder="Écrivez votre message…"
              hint={`${nouveauCommentaire.length} / 1000`}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                icon={<Send size={14} />}
                loading={commentaireEnCours}
                disabled={!nouveauCommentaire.trim()}
              >
                Envoyer
              </Button>
            </div>
          </form>

          {commentaires.length === 0 ? (
            <div className="text-center py-6 text-sm text-ink-soft">
              Aucun commentaire pour l'instant.
            </div>
          ) : (
            <div className="space-y-3 pt-3 border-t border-line">
              {commentaires.map((c) => (
                <div
                  key={c.id}
                  className={`border rounded-lg p-3 ${
                    c.visibilite === 'INTERNE'
                      ? 'border-warning/40 bg-warning-soft/20'
                      : 'border-line'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        firstName={c.auteur.first_name}
                        lastName={c.auteur.last_name}
                        size="sm"
                      />
                      <span className="text-sm font-medium text-ink">
                        {c.auteur.first_name} {c.auteur.last_name}
                      </span>
                      {c.visibilite === 'INTERNE' && (
                        <Badge variant="warning" size="sm">
                          <Lock size={10} /> Interne
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-ink-faint">
                      {new Date(c.date).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-sm text-ink whitespace-pre-wrap">{c.contenu}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modales confirmation devis */}
      <Modal
        open={confirmAccepter}
        onClose={() => setConfirmAccepter(false)}
        title="Accepter le devis"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmAccepter(false)}>
              Annuler
            </Button>
            <Button
              variant="success"
              onClick={() => handleRepondreDevis(true)}
              loading={actionEnCours}
              icon={<Check size={15} />}
            >
              Accepter
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          En acceptant ce devis, vous confirmez votre engagement pour un montant de{' '}
          <strong className="text-ink">
            {devis?.montant.toLocaleString('fr-FR')} Ar
          </strong>
          . Un technicien sera affecté à l'étude de votre site.
        </p>
      </Modal>

      <Modal
        open={confirmRefuser}
        onClose={() => setConfirmRefuser(false)}
        title="Refuser le devis"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmRefuser(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={() => handleRepondreDevis(false)}
              loading={actionEnCours}
              icon={<X size={15} />}
            >
              Refuser
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          En refusant ce devis, votre demande sera définitivement clôturée. Voulez-vous
          continuer ?
        </p>
      </Modal>
    </AppShell>
  );
}