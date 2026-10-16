import { type FormEvent, useEffect, useState } from 'react';
import { Check, MapPin } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/input';
import Textarea from '../ui/Texterea';
import { sitesApi } from '../../api/securitrack';
import type { Site } from '../../types/securitrack';
import CarteLeaflet from './CarteLeaflet';
import { useToast } from '../../context/ToastContext';

export default function SiteFormModal({
  open,
  onClose,
  onSuccess,
  site,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  site?: Site | null;
}) {
  const toast = useToast();
  const isEdit = !!site;

  const [nom, setNom] = useState('');
  const [adresse, setAdresse] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErreurs({});
    if (isEdit && site) {
      setNom(site.nom);
      setAdresse(site.adresse);
      setLatitude(site.latitude);
      setLongitude(site.longitude);
      setNotes(site.notes_faisabilite ?? '');
    } else {
      setNom('');
      setAdresse('');
      setLatitude(null);
      setLongitude(null);
      setNotes('');
    }
  }, [open, isEdit, site]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErreurs({});

    const err: Record<string, string> = {};
    if (!nom.trim()) err.nom = 'Nom requis.';
    if (!adresse.trim()) err.adresse = 'Adresse requise.';

    // Lat/Lng doivent être les deux ou aucun
    if ((latitude === null) !== (longitude === null)) {
      err.coords = 'Renseignez les deux coordonnées, ou aucune.';
    }
    if (latitude !== null && (latitude < -90 || latitude > 90)) {
      err.coords = 'Latitude doit être entre -90 et 90.';
    }
    if (longitude !== null && (longitude < -180 || longitude > 180)) {
      err.coords = 'Longitude doit être entre -180 et 180.';
    }

    if (Object.keys(err).length > 0) {
      setErreurs(err);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nom: nom.trim(),
        adresse: adresse.trim(),
        latitude,
        longitude,
        notes_faisabilite: notes,
      };

      if (isEdit && site) {
        await sitesApi.update(site.id, payload);
        toast.success('Site modifié', '');
      } else {
        toast.success('Bientôt', 'La création de site passe par CamTrack.');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const data = err?.response?.data;
      if (data && typeof data === 'object') {
        const mapped: Record<string, string> = {};
        for (const [key, val] of Object.entries(data)) {
          mapped[key] = Array.isArray(val) ? String(val[0]) : String(val);
        }
        setErreurs(mapped);
        toast.error('Erreur', 'Vérifiez les champs en rouge.');
      } else {
        toast.error('Erreur', "Impossible d'enregistrer.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Modifier le site' : 'Nouveau site'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} loading={saving} icon={<Check size={15} />}>
            {isEdit ? 'Enregistrer' : 'Créer le site'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom du site"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex : Entrepôt Nord"
        />
        {erreurs.nom && <p className="text-xs text-danger -mt-2">{erreurs.nom}</p>}

        <Input
          label="Adresse"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          icon={<MapPin size={15} />}
          placeholder="Ex : 12 rue des Caméras, Antananarivo"
        />
        {erreurs.adresse && <p className="text-xs text-danger -mt-2">{erreurs.adresse}</p>}

        {/* Coordonnées */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            step="any"
            label="Latitude"
            value={latitude ?? ''}
            onChange={(e) => setLatitude(e.target.value ? Number(e.target.value) : null)}
            placeholder="-18.8792"
          />
          <Input
            type="number"
            step="any"
            label="Longitude"
            value={longitude ?? ''}
            onChange={(e) => setLongitude(e.target.value ? Number(e.target.value) : null)}
            placeholder="47.5079"
          />
        </div>
        {erreurs.coords && <p className="text-xs text-danger -mt-2">{erreurs.coords}</p>}

        {/* Carte de prévisualisation */}
        {latitude !== null && longitude !== null && (
          <CarteLeaflet
            latitude={latitude}
            longitude={longitude}
            label={nom || 'Position du site'}
            height={200}
          />
        )}

        <Textarea
          label="Notes de faisabilité"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Accès, particularités, contraintes…"
        />
      </form>
    </Modal>
  );
}