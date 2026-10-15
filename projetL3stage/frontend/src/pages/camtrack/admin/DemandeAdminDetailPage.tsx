import { type FormEvent, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Package, MapPin, Camera, User,
  Check, X, Clock, Plus, Trash2, Send, UserPlus,
  AlertTriangle, MessageSquare, Lock, Globe, Calendar, Info,
  Eye,
} from 'lucide-react';
import {
  getDemandeAdmin,
  creerDevis,
  rejeterDemande,
  affecterTechnicienSite,
  getCommentairesDemande,
  ajouterCommentaireDemande,
  creerInstallation,
} from '../../../api/camtrackService';
import { getTechniciens } from '../../../api/authService';
import type {
  DemandeAdmin,
  LigneDevisCreateData,
  StatutDemande,
  Commentaire,
} from '../../../types/camtrack';
import type { Utilisateur } from '../../../types/user';
import AppShell from '../../../components/layout/AppShell';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Texterea';
import Badge from '../../../components/ui/Badge';
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

function formatAriary(v: number) {
  return `${v.toLocaleString('fr-FR')} Ar`;
}

export default function DemandeAdminDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const demandeId = Number(id);

  const [demande, setDemande] = useState<DemandeAdmin | null>(null);
  const [techniciens, setTechniciens] = useState<Utilisateur[]>([]);
  const [commentaires, setCommentaires] = useState<Commentaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionEnCours, setActionEnCours] = useState(false);

  // Modales
  const [devisOpen, setDevisOpen] = useState(false);
  const [affecterOpen, setAffecterOpen] = useState(false);
  const [confirmRejeter, setConfirmRejeter] = useState(false);
  const [planifInstallOpen, setPlanifInstallOpen] = useState(false);

  // Devis : lignes
  const [lignes, setLignes] = useState<LigneDevisCreateData[]>([
    { designation: '', quantite: 1, prix_unitaire: 0 },
  ]);

  // Affectation
  const [siteChoisi, setSiteChoisi] = useState<number | null>(null);
  const [technicienChoisi, setTechnicienChoisi] = useState('');

  // Planification installation
  const [installSiteChoisi, setInstallSiteChoisi] = useState<number | null>(null);
  const [installTechnicienChoisi, setInstallTechnicienChoisi] = useState('');
  const [installDate, setInstallDate] = useState('');
  const [planifInstallEnCours, setPlanifInstallEnCours] = useState(false);

  // Commentaire
  const [nouveauCommentaire, setNouveauCommentaire] = useState('');
  const [visibilite, setVisibilite] = useState<'PUBLIC' | 'INTERNE'>('PUBLIC');
  const [commentaireEnCours, setCommentaireEnCours] = useState(false);

  const charger = async () => {
    setLoading(true);
    try {
      const [demandeData, techsData, commData] = await Promise.all([
        getDemandeAdmin(demandeId),
        getTechniciens().catch(() => []),
        getCommentairesDemande(demandeId).catch(() => []),
      ]);
      setDemande(demandeData);
      setTechniciens(techsData);
      setCommentaires(commData);

      if (demandeData.sites.length > 0 && !siteChoisi) {
        setSiteChoisi(demandeData.sites[0].id);
      }
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

  // === Devis ===
  const ajouterLigne = () => {
    setLignes([...lignes, { designation: '', quantite: 1, prix_unitaire: 0 }]);
  };

  const supprimerLigne = (index: number) => {
    if (lignes.length === 1) return;
    setLignes(lignes.filter((_, i) => i !== index));
  };

  const modifierLigne = (
    index: number,
    champ: keyof LigneDevisCreateData,
    valeur: string | number
  ) => {
    const nouvelles = [...lignes];
    nouvelles[index] = { ...nouvelles[index], [champ]: valeur };
    setLignes(nouvelles);
  };

  const totalDevis = lignes.reduce((acc, l) => acc + l.quantite * l.prix_unitaire, 0);

  const handleCreerDevis = async (e: FormEvent) => {
    e.preventDefault();
    if (!demande) return;

    const lignesValides = lignes.filter(
      (l) => l.designation.trim().length >= 2 && l.quantite >= 1 && l.prix_unitaire >= 1
    );

    if (lignesValides.length === 0) {
      toast.error('Devis invalide', 'Ajoutez au moins une ligne valide.');
      return;
    }

    setActionEnCours(true);
    try {
      await creerDevis(demande.id, { lignes: lignesValides });
      toast.success('Devis créé', 'Le client a été notifié.');
      setDevisOpen(false);
      setLignes([{ designation: '', quantite: 1, prix_unitaire: 0 }]);
      await charger();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || 'Impossible de créer le devis.');
    } finally {
      setActionEnCours(false);
    }
  };

  // === Rejet ===
  const handleRejeter = async () => {
    if (!demande) return;
    setActionEnCours(true);
    try {
      await rejeterDemande(demande.id);
      toast.success('Demande rejetée', 'Le client a été notifié.');
      setConfirmRejeter(false);
      await charger();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || 'Impossible de rejeter.');
    } finally {
      setActionEnCours(false);
    }
  };

  // === Affectation ===
  const handleAffecter = async (e: FormEvent) => {
    e.preventDefault();
    if (!siteChoisi || !technicienChoisi) return;

    setActionEnCours(true);
    try {
      await affecterTechnicienSite(siteChoisi, Number(technicienChoisi));
      toast.success('Technicien affecté', "L'étude du site peut commencer.");
      setAffecterOpen(false);
      setTechnicienChoisi('');
      await charger();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || "Impossible d'affecter.");
    } finally {
      setActionEnCours(false);
    }
  };

  // === Planification installation ===
  const handlePlanifierInstallation = async (e: FormEvent) => {
    e.preventDefault();
    if (!installSiteChoisi || !installTechnicienChoisi) return;

    setPlanifInstallEnCours(true);
    try {
      await creerInstallation({
        site: installSiteChoisi,
        technicien: Number(installTechnicienChoisi),
        date_installation: installDate || null,
      });
      toast.success('Installation planifiée', 'Le technicien a été notifié.');
      setPlanifInstallOpen(false);
      setInstallSiteChoisi(null);
      setInstallTechnicienChoisi('');
      setInstallDate('');
      await charger();
    } catch (err: any) {
      toast.error(
        'Erreur',
        err?.response?.data?.detail || "Impossible de planifier l'installation."
      );
    } finally {
      setPlanifInstallEnCours(false);
    }
  };

  // === Commentaire ===
  const handleEnvoyerCommentaire = async (e: FormEvent) => {
    e.preventDefault();
    if (!demande || !nouveauCommentaire.trim() || nouveauCommentaire.trim().length < 2) {
      toast.error('Commentaire invalide', 'Minimum 2 caractères.');
      return;
    }
    setCommentaireEnCours(true);
    try {
      const c = await ajouterCommentaireDemande(demande.id, {
        contenu: nouveauCommentaire.trim(),
        visibilite,
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
            onClick={() => navigate('/camtrack/admin/demandes')}
            className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink mb-4"
          >
            <ArrowLeft size={16} /> Demandes
          </button>
          <EmptyState
            icon={<AlertTriangle size={32} />}
            title="Demande introuvable"
            action={<Button onClick={() => navigate('/camtrack/admin/demandes')}>Retour</Button>}
          />
        </div>
      </AppShell>
    );
  }

  const conf = STATUT_CONFIG[demande.statut];

  // ✅ NOUVELLE LOGIQUE : Affecter d'abord, Devis après l'étude
  const peutAffecter =
    demande.statut !== 'REJETEE' &&
    !demande.devis &&
    demande.sites.some((s) => !s.technicien);

  const peutEtablirDevis =
    !demande.devis &&
    demande.statut === 'EN_ATTENTE' &&
    demande.sites.length > 0 &&
    demande.sites.every((s) => s.statut === 'VALIDE');

  const peutPlanifierInstall =
    demande.statut === 'VALIDEE' && demande.sites.some((s) => s.statut === 'VALIDE');

  return (
    <AppShell
      title={`DEM-${String(demande.id).padStart(5, '0')}`}
      breadcrumb={['NjCam', 'CamTrack', 'Demandes', `DEM-${demande.id}`]}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        <button
          onClick={() => navigate('/camtrack/admin/demandes')}
          className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={16} /> Demandes
        </button>

        {/* En-tête */}
        <div className="bg-card border border-line rounded-lg p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant={conf.variant} dot>{conf.label}</Badge>
                <span className="text-xs text-ink-soft">
                  Soumise le {new Date(demande.date_soumission).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <h1 className="text-xl font-semibold text-ink mb-1">{demande.offre.nom}</h1>
              <p className="text-sm text-ink-soft">{demande.description}</p>
            </div>
          </div>

          {/* ✅ Actions RÉORDONNÉES */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-line">
            {/* 1. Affecter (PREMIER) */}
            {peutAffecter && (
              <Button
                icon={<UserPlus size={15} />}
                onClick={() => setAffecterOpen(true)}
              >
                Affecter un technicien
              </Button>
            )}

            {/* 2. Établir devis (APRÈS étude) */}
            {peutEtablirDevis && (
              <Button
                variant="secondary"
                icon={<FileText size={15} />}
                onClick={() => setDevisOpen(true)}
              >
                Établir un devis
              </Button>
            )}

            {/* 3. Planifier installation */}
            {peutPlanifierInstall && (
              <Button
                variant="success"
                icon={<Camera size={15} />}
                onClick={() => setPlanifInstallOpen(true)}
              >
                Planifier l'installation
              </Button>
            )}

            {/* 4. Voir installations */}
            <Button
              variant="secondary"
              icon={<Eye size={15} />}
              onClick={() => navigate('/camtrack/admin/installations')}
            >
              Voir les installations
            </Button>

            {/* 5. Rejeter */}
            {demande.statut === 'EN_ATTENTE' && (
              <Button
                variant="danger"
                icon={<X size={15} />}
                onClick={() => setConfirmRejeter(true)}
              >
                Rejeter
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-4">
            {/* Client */}
            <div className="bg-card border border-line rounded-lg p-6">
              <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                <User size={16} /> Client
              </h3>
              <div className="flex items-center gap-3">
                <UserAvatar
                  firstName={demande.client.first_name}
                  lastName={demande.client.last_name}
                  size="md"
                />
                <div>
                  <p className="text-sm font-medium text-ink">
                    {demande.client.first_name} {demande.client.last_name}
                  </p>
                  {demande.client.telephone && (
                    <p className="text-xs text-ink-soft">{demande.client.telephone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Offre */}
            <div className="bg-card border border-line rounded-lg p-6">
              <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                <Package size={16} /> Offre
              </h3>
              <p className="text-sm font-medium text-ink mb-1">{demande.offre.nom}</p>
              <p className="text-xs text-ink-soft mb-3">{demande.offre.description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-ink-soft">Caméras incluses</p>
                  <p className="text-ink font-medium">{demande.offre.nombre_cameras_inclus}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-soft">Abonnement</p>
                  <p className="text-ink font-medium">
                    {formatAriary(demande.offre.prix_abonnement)}/mois
                  </p>
                </div>
              </div>
            </div>

            {/* Sites */}
            <div className="bg-card border border-line rounded-lg p-6">
              <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                <MapPin size={16} /> Site{demande.sites.length > 1 ? 's' : ''}
              </h3>
              <div className="space-y-3">
                {demande.sites.map((site) => (
                  <div key={site.id} className="bg-surface rounded-md p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{site.nom}</p>
                        <p className="text-xs text-ink-soft">{site.adresse}</p>
                      </div>
                      <Badge variant={site.statut === 'VALIDE' ? 'success' : 'warning'} size="sm">
                        {site.statut === 'VALIDE' ? 'Validé' : 'En étude'}
                      </Badge>
                    </div>

                    {site.technicien_nom && (
                      <p className="text-xs text-ink-soft">
                        Technicien : <strong>{site.technicien_nom}</strong>
                      </p>
                    )}

                    {site.latitude && site.longitude && (
                      <p className="text-xs text-ink-soft font-mono">
                        📍 {site.latitude.toFixed(6)}, {site.longitude.toFixed(6)}
                      </p>
                    )}

                    {site.fichiers.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-line">
                        {site.fichiers.slice(0, 6).map((f) => (
                          <a
                            key={f.id}
                            href={f.fichier}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2 py-1 bg-card border border-line rounded text-xs hover:border-primary/40 transition-colors"
                          >
                            <Camera size={11} className="text-primary" />
                            <span className="truncate max-w-[100px]">
                              {f.fichier.split('/').pop()}
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Devis */}
            {demande.devis && (
              <div className="bg-card border border-line rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                    <FileText size={16} /> Devis
                  </h3>
                  <span className="text-xs text-ink-soft">
                    {new Date(demande.devis.date_etablissement).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <div className="border border-line rounded-md divide-y divide-line mb-3">
                  {demande.devis.lignes.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="text-ink">{l.designation}</p>
                        <p className="text-xs text-ink-soft">
                          {l.quantite} × {formatAriary(l.prix_unitaire)}
                        </p>
                      </div>
                      <span className="text-ink font-medium">{formatAriary(l.total)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3 py-3 bg-surface">
                    <span className="text-sm font-semibold text-ink">Total</span>
                    <span className="text-base font-bold text-primary">
                      {formatAriary(demande.devis.montant)}
                    </span>
                  </div>
                </div>

                {demande.statut === 'VALIDEE' && (
                  <div className="bg-success-soft border border-success/30 rounded-md p-3 flex items-center gap-2 text-success text-sm">
                    <Check size={16} /> Devis accepté par le client
                  </div>
                )}
                {demande.statut === 'REJETEE' && (
                  <div className="bg-danger-soft border border-danger/30 rounded-md p-3 flex items-center gap-2 text-danger text-sm">
                    <X size={16} /> Devis refusé par le client
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-4">
            <div className="bg-card border border-line rounded-lg p-6">
              <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                <Clock size={16} /> Progression
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-success">
                  <Check size={14} /> <span>Demande créée</span>
                </div>
                {demande.sites.some((s) => s.technicien_nom) && (
                  <div className="flex items-center gap-2 text-success">
                    <Check size={14} /> <span>Technicien affecté</span>
                  </div>
                )}
                {demande.sites.some((s) => s.statut === 'VALIDE') && (
                  <div className="flex items-center gap-2 text-success">
                    <Check size={14} /> <span>Site validé</span>
                  </div>
                )}
                {demande.devis && (
                  <div className="flex items-center gap-2 text-success">
                    <Check size={14} /> <span>Devis établi</span>
                  </div>
                )}
                {demande.statut === 'VALIDEE' && (
                  <div className="flex items-center gap-2 text-success">
                    <Check size={14} /> <span>Devis accepté</span>
                  </div>
                )}
                {demande.statut === 'REJETEE' && (
                  <div className="flex items-center gap-2 text-danger">
                    <X size={14} /> <span>Rejetée</span>
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
              placeholder="Écrivez un commentaire…"
              hint={`${nouveauCommentaire.length} / 1000`}
            />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibilite('PUBLIC')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    visibilite === 'PUBLIC'
                      ? 'bg-primary text-white'
                      : 'bg-surface text-ink-soft hover:bg-line'
                  }`}
                >
                  <Globe size={12} /> Public
                </button>
                <button
                  type="button"
                  onClick={() => setVisibilite('INTERNE')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    visibilite === 'INTERNE'
                      ? 'bg-warning text-white'
                      : 'bg-surface text-ink-soft hover:bg-line'
                  }`}
                >
                  <Lock size={12} /> Interne
                </button>
              </div>
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

          {commentaires.length > 0 && (
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

      {/* Modale Devis */}
      <Modal
        open={devisOpen}
        onClose={() => setDevisOpen(false)}
        title="Établir un devis"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDevisOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreerDevis}
              loading={actionEnCours}
              icon={<Check size={15} />}
              disabled={totalDevis <= 0}
            >
              Créer le devis ({formatAriary(totalDevis)})
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreerDevis} className="space-y-4">
          <p className="text-sm text-ink-soft">
            Ajoutez les lignes du devis (matériel, prestations). Le total est calculé
            automatiquement.
          </p>

          <div className="space-y-3">
            {lignes.map((ligne, idx) => (
              <div
                key={idx}
                className="bg-surface rounded-md p-3 grid grid-cols-12 gap-2 items-end"
              >
                <div className="col-span-5">
                  <label className="block text-xs text-ink-soft mb-1">Désignation</label>
                  <Input
                    value={ligne.designation}
                    onChange={(e) => modifierLigne(idx, 'designation', e.target.value)}
                    placeholder="Ex : Caméra IP HD"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-ink-soft mb-1">Qté</label>
                  <Input
                    type="number"
                    min={1}
                    value={ligne.quantite}
                    onChange={(e) => modifierLigne(idx, 'quantite', Number(e.target.value))}
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs text-ink-soft mb-1">Prix unitaire</label>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={ligne.prix_unitaire}
                    onChange={(e) =>
                      modifierLigne(idx, 'prix_unitaire', Number(e.target.value))
                    }
                  />
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => supprimerLigne(idx)}
                    disabled={lignes.length === 1}
                    className="p-2 rounded text-danger hover:bg-danger-soft transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="secondary"
            icon={<Plus size={15} />}
            onClick={ajouterLigne}
            fullWidth
          >
            Ajouter une ligne
          </Button>

          <div className="border-t border-line pt-4 flex items-center justify-between">
            <span className="text-sm font-medium text-ink">Total du devis</span>
            <span className="text-xl font-bold text-primary">{formatAriary(totalDevis)}</span>
          </div>
        </form>
      </Modal>

      {/* Modale Affecter */}
      <Modal
        open={affecterOpen}
        onClose={() => setAffecterOpen(false)}
        title="Affecter un technicien à l'étude"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAffecterOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAffecter}
              loading={actionEnCours}
              disabled={!siteChoisi || !technicienChoisi}
              icon={<UserPlus size={15} />}
            >
              Affecter
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Site"
            value={siteChoisi?.toString() || ''}
            onChange={(e) => setSiteChoisi(Number(e.target.value))}
          >
            {demande.sites.map((s) => (
              <option key={s.id} value={s.id} disabled={!!s.technicien}>
                {s.nom} {s.technicien ? '(déjà affecté)' : ''}
              </option>
            ))}
          </Select>

          <Select
            label="Technicien"
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
        </div>
      </Modal>

      {/* Modale Planifier Installation */}
      <Modal
        open={planifInstallOpen}
        onClose={() => setPlanifInstallOpen(false)}
        title="Planifier l'installation"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPlanifInstallOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="success"
              onClick={handlePlanifierInstallation}
              loading={planifInstallEnCours}
              disabled={!installSiteChoisi || !installTechnicienChoisi}
              icon={<Camera size={15} />}
            >
              Planifier
            </Button>
          </>
        }
      >
        <form onSubmit={handlePlanifierInstallation} className="space-y-4">
          <div className="bg-info-soft border border-info/30 rounded-md p-3 text-xs text-info flex items-start gap-2">
            <Info size={14} className="shrink-0 mt-0.5" />
            <span>
              Vous planifiez l'installation sur un site validé. Le technicien recevra une
              notification.
            </span>
          </div>

          <Select
            label="Site validé"
            value={installSiteChoisi?.toString() || ''}
            onChange={(e) => setInstallSiteChoisi(Number(e.target.value))}
          >
            <option value="">Choisir un site…</option>
            {demande.sites
              .filter((s) => s.statut === 'VALIDE')
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom} — {s.adresse}
                </option>
              ))}
          </Select>

          <Select
            label="Technicien"
            value={installTechnicienChoisi}
            onChange={(e) => setInstallTechnicienChoisi(e.target.value)}
          >
            <option value="">Choisir un technicien…</option>
            {techniciens.map((t) => (
              <option key={t.id} value={t.id}>
                {t.first_name} {t.last_name}
                {t.specialite ? ` — ${t.specialite}` : ''}
              </option>
            ))}
          </Select>

          <Input
            type="date"
            label="Date d'installation (optionnel)"
            value={installDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setInstallDate(e.target.value)}
            icon={<Calendar size={15} />}
            hint="Vous pouvez laisser vide et définir la date plus tard"
          />
        </form>
      </Modal>

      {/* Confirm Rejet */}
      <Modal
        open={confirmRejeter}
        onClose={() => setConfirmRejeter(false)}
        title="Rejeter la demande"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmRejeter(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleRejeter}
              loading={actionEnCours}
              icon={<X size={15} />}
            >
              Rejeter définitivement
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">
            En rejetant cette demande, elle sera définitivement clôturée. Le client sera
            notifié.
          </p>
          <div className="bg-warning-soft border border-warning/30 rounded-md p-3 flex items-start gap-2 text-xs text-warning">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>Cette action est irréversible.</span>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}