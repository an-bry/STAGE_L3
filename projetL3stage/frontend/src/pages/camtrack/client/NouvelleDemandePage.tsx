import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Upload, X, Camera, FileText, Send, Info, Package,
} from 'lucide-react';
import { getOffres, creerDemande } from '../../../api/camtrackService';
import type { Offre, DemandeCreateData } from '../../../types/camtrack';
import AppShell from '../../../components/layout/AppShell';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Texterea';
import { useToast } from '../../../context/ToastContext';

const MAX_PHOTOS = 10;
const MAX_PLANS = 3;
const TAILLE_MAX = 5 * 1024 * 1024; // 5 Mo

export default function NouvelleDemandePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [offres, setOffres] = useState<Offre[]>([]);
  const [offreId, setOffreId] = useState<string>(searchParams.get('offre') || '');
  const [description, setDescription] = useState('');
  const [nomSite, setNomSite] = useState('');
  const [adresse, setAdresse] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [plans, setPlans] = useState<File[]>([]);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});

  useEffect(() => {
    getOffres()
      .then(setOffres)
      .catch(() => toast.error('Erreur', 'Impossible de charger les offres.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const offreSelectionnee = offres.find((o) => o.id === Number(offreId));

  const valider = (): boolean => {
    const e: Record<string, string> = {};
    if (!offreId) e.offre = "Choisissez une offre.";
    if (!description.trim() || description.trim().length < 10)
      e.description = 'La description doit contenir au moins 10 caractères.';
    if (!nomSite.trim()) e.nomSite = 'Le nom du site est obligatoire.';
    if (!adresse.trim()) e.adresse = "L'adresse est obligatoire.";
    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  const ajouterFichiers = (
    files: FileList | null,
    setter: (f: File[]) => void,
    max: number,
    actuels: File[],
    extensions: string[]
  ) => {
    if (!files) return;
    const nouveaux: File[] = [];
    for (const f of Array.from(files)) {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      if (!extensions.includes(ext)) {
        toast.error('Format non accepté', `"${f.name}" — autorisés : ${extensions.join(', ')}`);
        continue;
      }
      if (f.size > TAILLE_MAX) {
        toast.error('Fichier trop gros', `"${f.name}" dépasse 5 Mo.`);
        continue;
      }
      nouveaux.push(f);
    }
    const total = [...actuels, ...nouveaux];
    if (total.length > max) {
      toast.warning('Limite atteinte', `Maximum ${max} fichiers.`);
      setter(total.slice(0, max));
    } else {
      setter(total);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valider()) return;

    setEnvoiEnCours(true);
    try {
      const data: DemandeCreateData = {
        offre: Number(offreId),
        description: description.trim(),
        nom_site: nomSite.trim(),
        adresse: adresse.trim(),
        photos: photos.length ? photos : undefined,
        plans: plans.length ? plans : undefined,
      };
      await creerDemande(data);
      toast.success('Demande envoyée !', 'Notre équipe va l\'examiner prochainement.');
      navigate('/camtrack/client/demandes');
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || "Impossible d'envoyer la demande.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  return (
    <AppShell
      title="Nouvelle demande"
      breadcrumb={['NjCam', 'CamTrack', 'Catalogue', 'Nouvelle demande']}
    >
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <button
          onClick={() => navigate('/camtrack/client/offres')}
          className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={16} /> Retour au catalogue
        </button>

        {/* Info */}
        <div className="bg-info-soft border border-info/30 rounded-md p-3 flex items-start gap-2 text-info text-xs">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>
            Remplissez ce formulaire pour demander une installation. Un devis vous sera
            envoyé sous 48h.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Offre */}
          <div className="bg-card border border-line rounded-lg p-6 space-y-4">
            <h3 className="text-base font-semibold text-ink flex items-center gap-2">
              <Package size={16} /> Offre choisie
            </h3>

            <Select
              label="Sélectionnez une offre"
              value={offreId}
              onChange={(e) => setOffreId(e.target.value)}
              error={erreurs.offre}
            >
              <option value="">Choisir une offre…</option>
              {offres.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nom} — {o.nombre_cameras_inclus} caméras —{' '}
                  {o.prix_abonnement.toLocaleString('fr-FR')} Ar/mois
                </option>
              ))}
            </Select>

            {offreSelectionnee && (
              <div className="bg-primary-soft rounded-md p-3 text-sm">
                <p className="font-medium text-primary mb-1">{offreSelectionnee.nom}</p>
                <p className="text-ink-soft text-xs">{offreSelectionnee.description}</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-card border border-line rounded-lg p-6 space-y-4">
            <h3 className="text-base font-semibold text-ink flex items-center gap-2">
              <FileText size={16} /> Description du besoin
            </h3>

            <Textarea
              label="Décrivez votre projet"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Expliquez vos besoins : nombre de bâtiments, zones à surveiller, contraintes particulières…"
              error={erreurs.description}
              hint={`${description.trim().length} / 2000 caractères (min 10)`}
            />
          </div>

          {/* Site */}
          <div className="bg-card border border-line rounded-lg p-6 space-y-4">
            <h3 className="text-base font-semibold text-ink flex items-center gap-2">
              <Camera size={16} /> Localisation du site
            </h3>

            <Input
              label="Nom du site"
              value={nomSite}
              onChange={(e) => setNomSite(e.target.value)}
              placeholder="Ex : Siège social, Entrepôt Nord…"
              error={erreurs.nomSite}
            />

            <Input
              label="Adresse complète"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="Ex : Lot II M 45 Bis, Antananarivo 101"
              error={erreurs.adresse}
            />
          </div>

          {/* Upload */}
          <div className="bg-card border border-line rounded-lg p-6 space-y-5">
            <h3 className="text-base font-semibold text-ink flex items-center gap-2">
              <Upload size={16} /> Photos et plans (optionnel)
            </h3>

            {/* Photos */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Photos du site ({photos.length}/{MAX_PHOTOS})
              </label>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) =>
                  ajouterFichiers(e.target.files, setPhotos, MAX_PHOTOS, photos, [
                    'jpg', 'jpeg', 'png', 'webp',
                  ])
                }
                className="block w-full text-sm text-ink-soft file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-soft file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
              {photos.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {photos.map((f, i) => (
                    <div
                      key={i}
                      className="relative bg-surface rounded-md p-2 flex items-center gap-2 text-xs"
                    >
                      <Camera size={14} className="text-primary shrink-0" />
                      <span className="truncate flex-1">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                        className="text-danger hover:bg-danger-soft rounded p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Plans */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Plans ({plans.length}/{MAX_PLANS})
              </label>
              <input
                type="file"
                multiple
                accept="application/pdf,image/jpeg,image/jpg,image/png"
                onChange={(e) =>
                  ajouterFichiers(e.target.files, setPlans, MAX_PLANS, plans, [
                    'pdf', 'jpg', 'jpeg', 'png',
                  ])
                }
                className="block w-full text-sm text-ink-soft file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-soft file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
              {plans.length > 0 && (
                <div className="mt-3 space-y-2">
                  {plans.map((f, i) => (
                    <div
                      key={i}
                      className="bg-surface rounded-md p-2 flex items-center gap-2 text-xs"
                    >
                      <FileText size={14} className="text-primary shrink-0" />
                      <span className="truncate flex-1">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => setPlans(plans.filter((_, idx) => idx !== i))}
                        className="text-danger hover:bg-danger-soft rounded p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-ink-soft">
              Formats acceptés : JPG, PNG, WebP, PDF. Taille max : 5 Mo par fichier.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/camtrack/client/offres')}
              disabled={envoiEnCours}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              icon={<Send size={15} />}
              loading={envoiEnCours}
              disabled={!offreId || !description.trim() || !nomSite.trim() || !adresse.trim()}
            >
              Envoyer la demande
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}