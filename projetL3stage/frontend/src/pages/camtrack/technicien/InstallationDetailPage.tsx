import { type FormEvent, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Building2, Camera, CheckCircle2,
  PlayCircle, HardDrive, Plus, 
  AlertTriangle, Calendar, Shield, Image as ImageIcon,
   Download, Info,
} from 'lucide-react';
import {
  getMesInstallations,
  demarrerInstallation,
  terminerInstallation,
  ajouterEquipement,
  ajouterPhotoInstallation,
  telechargerRapportInstallationPDF,
} from '../../../api/camtrackService';
import type {
  InstallationTechnicien,
  EquipementCreateData,
  TypeEquipement,
} from '../../../types/camtrack';
import AppShell from '../../../components/layout/AppShell';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/input';
import Select from '../../../components/ui/Select';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import EmptyState from '../../../components/ui/EmptyState';
import FloatingBar from '../../../components/ui/FloatingBar';
import { useToast } from '../../../context/ToastContext';

const TYPE_LABELS: Record<TypeEquipement, string> = {
  CAMERA: 'Caméra',
  NVR_DVR: 'NVR/DVR',
};

const STATUT_CONFIG = {
  PLANIFIEE: { label: 'Planifiée', variant: 'primary' as const },
  EN_COURS: { label: 'En cours', variant: 'warning' as const },
  TERMINEE: { label: 'Terminée', variant: 'success' as const },
};

export default function InstallationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const installId = Number(id);

  const [installation, setInstallation] = useState<InstallationTechnicien | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modales
  const [equipOpen, setEquipOpen] = useState(false);
  const [confirmTerminer, setConfirmTerminer] = useState(false);

  // Formulaire équipement
  const [equipType, setEquipType] = useState<TypeEquipement>('CAMERA');
  const [equipModel, setEquipModel] = useState('');
  const [equipIP, setEquipIP] = useState('');
  const [equipDebutGarantie, setEquipDebutGarantie] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [equipFinGarantie, setEquipFinGarantie] = useState('');
  const [equipEnCours, setEquipEnCours] = useState(false);

  // Photo upload
  const [photoEnCours, setPhotoEnCours] = useState(false);

  // PDF
  const [pdfEnCours, setPdfEnCours] = useState(false);

  const charger = async () => {
    setLoading(true);
    try {
      const list = await getMesInstallations();
      const found = list.find((i) => i.id === installId) || null;
      setInstallation(found);
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

  // === Démarrer ===
  const handleDemarrer = async () => {
    if (!installation) return;
    setSaving(true);
    try {
      const updated = await demarrerInstallation(installation.id);
      setInstallation(updated);
      toast.success('Installation démarrée', 'Vous pouvez ajouter les équipements.');
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || 'Impossible de démarrer.');
    } finally {
      setSaving(false);
    }
  };

  // === Ajouter équipement ===
  const resetEquipForm = () => {
    setEquipType('CAMERA');
    setEquipModel('');
    setEquipIP('');
    setEquipDebutGarantie(new Date().toISOString().split('T')[0]);
    setEquipFinGarantie('');
  };

  const handleAjouterEquip = async (e: FormEvent) => {
    e.preventDefault();
    if (!installation) return;

    if (!equipModel.trim()) {
      toast.error('Modèle manquant', 'Renseignez le modèle.');
      return;
    }
    if (!equipDebutGarantie || !equipFinGarantie) {
      toast.error('Dates manquantes', 'Renseignez les dates de garantie.');
      return;
    }
    if (new Date(equipFinGarantie) <= new Date(equipDebutGarantie)) {
      toast.error(
        'Dates invalides',
        'La date de fin doit être postérieure à la date de début.'
      );
      return;
    }

    setEquipEnCours(true);
    try {
      const data: EquipementCreateData = {
        type_equipement: equipType,
        model: equipModel.trim(),
        adresse_ip: equipIP.trim() || null,
        date_debut_garantie: equipDebutGarantie,
        date_fin_garantie: equipFinGarantie,
      };
      await ajouterEquipement(installation.id, data);
      toast.success('Équipement ajouté', '');
      setEquipOpen(false);
      resetEquipForm();
      await charger();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || "Impossible d'ajouter.");
    } finally {
      setEquipEnCours(false);
    }
  };

  // === Ajouter photo ===
  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !installation) return;

    setPhotoEnCours(true);
    try {
      await ajouterPhotoInstallation(installation.id, file);
      toast.success('Photo ajoutée', '');
      await charger();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || "Impossible d'ajouter la photo.");
    } finally {
      setPhotoEnCours(false);
      e.target.value = '';
    }
  };

  // === Terminer ===
  const handleTerminer = async () => {
    if (!installation) return;
    setSaving(true);
    try {
      await terminerInstallation(installation.id);
      toast.success('Installation terminée', 'Le rapport a été généré.');
      setConfirmTerminer(false);
      await charger();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || 'Impossible de terminer.');
    } finally {
      setSaving(false);
    }
  };

  // === PDF ===
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
            onClick={() => navigate('/camtrack/technicien/installations')}
            className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink mb-4"
          >
            <ArrowLeft size={16} /> Mes installations
          </button>
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<AlertTriangle size={32} />}
              title="Installation introuvable"
              action={
                <Button onClick={() => navigate('/camtrack/technicien/installations')}>
                  Retour
                </Button>
              }
            />
          </div>
        </div>
      </AppShell>
    );
  }

  const conf = STATUT_CONFIG[installation.statut];
  const canDemarrer = installation.statut === 'PLANIFIEE';
  const canEdit = installation.statut === 'EN_COURS';
  const canTerminer = installation.statut === 'EN_COURS' && installation.equipements.length > 0;
  const isTerminee = installation.statut === 'TERMINEE';

  return (
    <AppShell
      title={`INST-${String(installation.id).padStart(5, '0')}`}
      breadcrumb={['NjCam', 'CamTrack', 'Mes installations', `INST-${installation.id}`]}
    >
      <div className="p-6 max-w-5xl mx-auto space-y-5 pb-32">
        <button
          onClick={() => navigate('/camtrack/technicien/installations')}
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
                <Badge variant={conf.variant} dot>{conf.label}</Badge>
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
              <p className="text-xs text-ink-soft mb-0.5 flex items-center gap-1">
                <Building2 size={11} /> Client
              </p>
              <p className="text-ink">{installation.client_nom}</p>
            </div>
            <div>
              <p className="text-xs text-ink-soft mb-0.5">Équipements</p>
              <p className="text-ink">{installation.equipements.length} installé(s)</p>
            </div>
          </div>
        </div>

        {/* Info démarrage */}
        {canDemarrer && (
          <div className="bg-info-soft border border-info/30 rounded-lg p-4 flex items-start gap-3">
            <Info size={18} className="text-info shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink mb-1">Prêt à démarrer ?</p>
              <p className="text-xs text-ink-soft">
                Cliquez sur "Démarrer l'installation" pour commencer. Vous pourrez ensuite
                ajouter les équipements installés avec leurs dates de garantie.
              </p>
            </div>
          </div>
        )}

        {/* Équipements */}
        <div className="bg-card border border-line rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-ink flex items-center gap-2">
              <HardDrive size={16} /> Équipements installés ({installation.equipements.length})
            </h3>
            {canEdit && (
              <Button
                size="sm"
                icon={<Plus size={15} />}
                onClick={() => setEquipOpen(true)}
              >
                Ajouter un équipement
              </Button>
            )}
          </div>

          {installation.equipements.length === 0 ? (
            <EmptyState
              icon={<HardDrive size={24} />}
              title="Aucun équipement"
              description={
                canEdit
                  ? 'Ajoutez les équipements installés (caméras, NVR/DVR) avec leurs dates de garantie.'
                  : canDemarrer
                  ? "Démarrez l'installation pour ajouter des équipements."
                  : 'Aucun équipement enregistré.'
              }
            />
          ) : (
            <div className="space-y-3">
              {installation.equipements.map((eq) => {
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
                    <Badge variant={expiree ? 'danger' : jours <= 30 ? 'warning' : 'success'} size="sm" dot>
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
        {canEdit && (
          <div className="bg-card border border-line rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-ink flex items-center gap-2">
                <ImageIcon size={16} /> Photos ({installation.fichiers.length})
              </h3>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhoto}
                  className="hidden"
                  disabled={photoEnCours}
                />
                <span className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary-hover transition-colors">
                  <Plus size={14} />
                  {photoEnCours ? 'Envoi…' : 'Ajouter une photo'}
                </span>
              </label>
            </div>

            {installation.fichiers.length === 0 ? (
              <p className="text-sm text-ink-soft text-center py-6">
                Aucune photo pour l'instant. Ajoutez des photos de l'installation.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {installation.fichiers.map((f) => (
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
            )}
          </div>
        )}

        {/* Photos (lecture seule) */}
        {isTerminee && installation.fichiers.length > 0 && (
          <div className="bg-card border border-line rounded-lg p-6">
            <h3 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
              <ImageIcon size={16} /> Photos ({installation.fichiers.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {installation.fichiers.map((f) => (
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

        {/* PDF rapport (si terminée) */}
        {isTerminee && (
          <div className="bg-success-soft border border-success/30 rounded-lg p-5 flex items-start gap-3">
            <CheckCircle2 size={20} className="text-success shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink mb-1">
                Installation terminée
              </p>
              <p className="text-xs text-ink-soft mb-3">
                Le rapport d'installation est disponible. Le client sera notifié pour
                validation.
              </p>
              <Button
                variant="secondary"
                icon={<Download size={15} />}
                onClick={handleDownloadPDF}
                loading={pdfEnCours}
                size="sm"
              >
                Télécharger le rapport PDF
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* BARRE FLOTTANTE */}
      {(canDemarrer || canTerminer) && (
        <FloatingBar>
          <div className="text-xs text-ink-soft hidden sm:block">
            {canDemarrer && <span>Prêt à démarrer</span>}
            {canTerminer && (
              <span className="text-success">
                ✅ {installation.equipements.length} équipement
                {installation.equipements.length > 1 ? 's' : ''} ajouté
                {installation.equipements.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex gap-2 ml-auto">
            {canDemarrer && (
              <Button
                variant="success"
                icon={<PlayCircle size={15} />}
                onClick={handleDemarrer}
                loading={saving}
              >
                Démarrer l'installation
              </Button>
            )}
            {canTerminer && (
              <Button
                variant="success"
                icon={<CheckCircle2 size={15} />}
                onClick={() => setConfirmTerminer(true)}
              >
                Terminer l'installation
              </Button>
            )}
          </div>
        </FloatingBar>
      )}

      {/* Modale Ajouter équipement */}
      <Modal
        open={equipOpen}
        onClose={() => setEquipOpen(false)}
        title="Ajouter un équipement"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEquipOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAjouterEquip}
              loading={equipEnCours}
              icon={<Plus size={15} />}
            >
              Ajouter
            </Button>
          </>
        }
      >
        <form onSubmit={handleAjouterEquip} className="space-y-4">
          <Select
            label="Type d'équipement"
            value={equipType}
            onChange={(e) => setEquipType(e.target.value as TypeEquipement)}
          >
            <option value="CAMERA">Caméra</option>
            <option value="NVR_DVR">NVR/DVR</option>
          </Select>

          <Input
            label="Modèle"
            value={equipModel}
            onChange={(e) => setEquipModel(e.target.value)}
            placeholder="Ex : Hikvision DS-2CD2143"
          />

          <Input
            label="Adresse IP (optionnel)"
            value={equipIP}
            onChange={(e) => setEquipIP(e.target.value)}
            placeholder="Ex : 192.168.1.101"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Début de garantie"
              value={equipDebutGarantie}
              onChange={(e) => setEquipDebutGarantie(e.target.value)}
            />
            <Input
              type="date"
              label="Fin de garantie"
              value={equipFinGarantie}
              min={equipDebutGarantie}
              onChange={(e) => setEquipFinGarantie(e.target.value)}
            />
          </div>

          <div className="bg-info-soft border border-info/30 rounded-md p-3 text-xs text-info">
            💡 La garantie standard est souvent de 2 ans. Adaptez selon le fabricant.
          </div>
        </form>
      </Modal>

      {/* Modale Terminer */}
      <Modal
        open={confirmTerminer}
        onClose={() => setConfirmTerminer(false)}
        title="Terminer l'installation"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmTerminer(false)}>
              Annuler
            </Button>
            <Button
              variant="success"
              onClick={handleTerminer}
              loading={saving}
              icon={<CheckCircle2 size={15} />}
            >
              Terminer définitivement
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">
            En terminant cette installation, le rapport sera généré automatiquement et le
            client sera notifié pour validation.
          </p>
          <div className="bg-surface rounded-md p-3 space-y-1 text-xs text-ink-soft">
            <p>
              <strong>Site :</strong> {installation.site_nom}
            </p>
            <p>
              <strong>Équipements :</strong> {installation.equipements.length}
            </p>
            <p>
              <strong>Photos :</strong> {installation.fichiers.length}
            </p>
          </div>
          <div className="bg-warning-soft border border-warning/30 rounded-md p-3 flex items-start gap-2 text-xs text-warning">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>Cette action est irréversible.</span>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}