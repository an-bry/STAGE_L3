import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Camera, CheckCircle2,
  HardDrive, Calendar, Shield, Image as ImageIcon,
  FileText, Download, AlertTriangle, Info,
} from 'lucide-react';
import {
  getRapportInstallation,
  validerInstallation,
  telechargerRapportInstallationPDF,
} from '../../../api/camtrackService';
import api from '../../../api/axiosConfig';
import type {
  InstallationTechnicien,
  RapportInstallation,
} from '../../../types/camtrack';
import AppShell from '../../../components/layout/AppShell';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import EmptyState from '../../../components/ui/EmptyState';
import { useToast } from '../../../context/ToastContext';

const STATUT_CONFIG = {
  PLANIFIEE: { label: 'Planifiée', variant: 'primary' as const },
  EN_COURS: { label: 'En cours', variant: 'warning' as const },
  TERMINEE: { label: 'Terminée', variant: 'success' as const },
};

const TYPE_LABELS: Record<string, string> = {
  CAMERA: 'Caméra',
  NVR_DVR: 'NVR/DVR',
};

export default function InstallationClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const installId = Number(id);

  const [installation, setInstallation] = useState<InstallationTechnicien | null>(null);
  const [rapport, setRapport] = useState<RapportInstallation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pdfEnCours, setPdfEnCours] = useState(false);

  const [confirmValider, setConfirmValider] = useState(false);

  const charger = async () => {
    setLoading(true);
    try {
      const instResp = await api.get(`/camtrack/installations/${installId}/client/`);
      setInstallation(instResp.data);

      if (instResp.data.statut === 'TERMINEE') {
        try {
          const r = await getRapportInstallation(installId);
          setRapport(r);
        } catch {
          // Pas encore de rapport
        }
      }
    } catch {
      toast.error('Erreur', "Impossible de charger l'installation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installId]);

  const handleValider = async () => {
    if (!installation) return;
    setSaving(true);
    try {
      await validerInstallation(installation.id);
      toast.success(
        'Installation validée',
        "Merci ! L'installation est maintenant officiellement validée."
      );
      setConfirmValider(false);
      await charger();
    } catch (err: any) {
      toast.error(
        'Erreur',
        err?.response?.data?.detail || 'Impossible de valider.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!installation) return;
    setPdfEnCours(true);
    try {
      await telechargerRapportInstallationPDF(installation.id);
      toast.success('PDF téléchargé', '');
    } catch {
      toast.error('Erreur', 'Impossible de télécharger.');
    } finally {
      setPdfEnCours(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Installation">
        <div className="p-6 text-ink-soft">Chargement…</div>
      </AppShell>
    );
  }

  if (!installation) {
    return (
      <AppShell title="Installation">
        <div className="p-6 max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/camtrack/client/installations')}
            className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink mb-4"
          >
            <ArrowLeft size={16} /> Mes installations
          </button>
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<AlertTriangle size={32} />}
              title="Installation introuvable"
              action={
                <Button onClick={() => navigate('/camtrack/client/installations')}>
                  Retour
                </Button>
              }
            />
          </div>
        </div>
      </AppShell>
    );
  }

  const conf = STATUT_CONFIG[installation.statut as keyof typeof STATUT_CONFIG];
  const peutValider =
    installation.statut === 'TERMINEE' && rapport && !rapport.validation_client;
  const dejaValidee = rapport?.validation_client;

  // ── Protections contre undefined ──
  const equipements = installation.equipements ?? [];
  const fichiers = installation.fichiers ?? [];

  return (
    <AppShell
      title={`INST-${String(installation.id).padStart(5, '0')}`}
      breadcrumb={['NjCam', 'CamTrack', 'Mes installations', `INST-${installation.id}`]}
    >
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <button
          onClick={() => navigate('/camtrack/client/installations')}
          className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={16} /> Mes installations
        </button>

        {/* En-tête */}
        <div className="bg-card border border-line rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-md bg-primary-soft">
              <Camera size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge variant={conf.variant} dot>
                  {conf.label}
                </Badge>
                {installation.date_installation && (
                  <span className="text-xs text-ink-soft flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(installation.date_installation).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-semibold text-ink">{installation.site_nom}</h1>
              <p className="text-sm text-ink-soft flex items-center gap-1 mt-1">
                <MapPin size={13} /> {installation.adresse}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-line grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-ink-soft mb-0.5">Équipements</p>
              <p className="text-ink">{equipements.length} installé(s)</p>
            </div>
            <div>
              <p className="text-xs text-ink-soft mb-0.5">Statut</p>
              <p className="text-ink">{conf.label}</p>
            </div>
          </div>
        </div>

        {/* Bandeau validation */}
        {peutValider && (
          <div className="bg-success-soft border border-success/30 rounded-lg p-5 flex items-start gap-4">
            <CheckCircle2 size={22} className="text-success shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink mb-1">
                Installation terminée — En attente de votre validation
              </p>
              <p className="text-sm text-ink-soft mb-3">
                Le technicien a terminé l'installation. Vérifiez le rapport et les
                équipements installés, puis validez pour clôturer le processus.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  icon={<Download size={15} />}
                  onClick={handleDownloadPDF}
                  loading={pdfEnCours}
                  size="sm"
                >
                  Télécharger le rapport
                </Button>
                <Button
                  variant="success"
                  icon={<CheckCircle2 size={15} />}
                  onClick={() => setConfirmValider(true)}
                  size="sm"
                >
                  Valider l'installation
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Déjà validée */}
        {dejaValidee && (
          <div className="bg-success-soft border border-success/30 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 size={18} className="text-success shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-success">
                Installation validée
              </p>
              {rapport?.date_validation && (
                <p className="text-xs text-success">
                  Validée le{' '}
                  {new Date(rapport.date_validation).toLocaleString('fr-FR')}
                </p>
              )}
            </div>
            <Button
              variant="secondary"
              icon={<Download size={14} />}
              onClick={handleDownloadPDF}
              loading={pdfEnCours}
              size="sm"
            >
              PDF
            </Button>
          </div>
        )}

        {/* Équipements */}
        <div className="bg-card border border-line rounded-lg p-6">
          <h3 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
            <HardDrive size={16} /> Équipements installés ({equipements.length})
          </h3>

          {equipements.length === 0 ? (
            <EmptyState
              icon={<HardDrive size={24} />}
              title="Aucun équipement"
              description="Aucun équipement n'a encore été installé."
            />
          ) : (
            <div className="space-y-3">
              {equipements.map((eq) => {
                const jours = eq.garantie_jours_restants;
                const expiree = eq.garantie_expiree;

                return (
                  <div
                    key={eq.id}
                    className="bg-surface rounded-md p-3 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`p-2 rounded-md shrink-0 ${
                          eq.type_equipement === 'CAMERA'
                            ? 'bg-primary-soft text-primary'
                            : 'bg-info-soft text-info'
                        }`}
                      >
                        {eq.type_equipement === 'CAMERA' ? (
                          <Camera size={16} />
                        ) : (
                          <HardDrive size={16} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink mb-1">
                          {TYPE_LABELS[eq.type_equipement]} — {eq.model}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
                          {eq.adresse_ip && (
                            <span className="font-mono">IP: {eq.adresse_ip}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(eq.date_debut_garantie).toLocaleDateString('fr-FR')} →{' '}
                            {new Date(eq.date_fin_garantie).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={expiree ? 'danger' : jours <= 30 ? 'warning' : 'success'}
                      size="sm"
                      dot
                    >
                      <Shield size={10} />
                      {expiree ? 'Expirée' : `${jours} j`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Photos */}
        {fichiers.length > 0 && (
          <div className="bg-card border border-line rounded-lg p-6">
            <h3 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
              <ImageIcon size={16} /> Photos de l'installation ({fichiers.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {fichiers.map((f) => (
                <a
                  key={f.id}
                  href={f.fichier}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-surface rounded-md p-3 flex flex-col items-center gap-2 hover:border-primary/40 border border-line transition-colors"
                >
                  <ImageIcon size={20} className="text-primary" />
                  <span className="text-xs text-ink-soft truncate max-w-full">
                    {f.fichier.split('/').pop()}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Rapport */}
        {rapport && (
          <div className="bg-card border border-line rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <FileText size={16} /> Rapport d'installation
              </h3>
              <Button
                variant="secondary"
                icon={<Download size={14} />}
                onClick={handleDownloadPDF}
                loading={pdfEnCours}
                size="sm"
              >
                Télécharger PDF
              </Button>
            </div>
            <pre className="whitespace-pre-wrap bg-surface rounded-md p-4 text-sm text-ink font-sans">
              {rapport.contenu}
            </pre>
          </div>
        )}
      </div>

      {/* Confirm Valider */}
      <Modal
        open={confirmValider}
        onClose={() => setConfirmValider(false)}
        title="Valider l'installation"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmValider(false)}>
              Annuler
            </Button>
            <Button
              variant="success"
              icon={<CheckCircle2 size={15} />}
              onClick={handleValider}
              loading={saving}
            >
              Valider définitivement
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">
            En validant cette installation, vous confirmez que tout est conforme à vos
            attentes. Le processus sera définitivement clôturé.
          </p>
          <div className="bg-info-soft border border-info/30 rounded-md p-3 flex items-start gap-2 text-xs text-info">
            <Info size={14} className="shrink-0 mt-0.5" />
            <span>Cette action est irréversible.</span>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}