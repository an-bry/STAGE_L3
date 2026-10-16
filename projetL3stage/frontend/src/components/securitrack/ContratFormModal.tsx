import { type FormEvent, useEffect, useState } from 'react';
import { Calendar, Check  } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/input';
import Select from '../ui/Select';
import { contratsApi, clientsApi, equipementsApi } from '../../api/securitrack';
import type { Contrat, Equipement, Utilisateur } from '../../types/securitrack';
import SelecteurEquipements from './SelecteurEquipements';
import { useToast } from '../../context/ToastContext';

export default function ContratFormModal({
  open,
  onClose,
  onSuccess,
  contrat,
  clientInitial,
  equipementsInitiaux,
  dureeEngagementMois,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contrat?: Contrat | null; // null = création
  clientInitial?: number;
  equipementsInitiaux?: number[];
  dureeEngagementMois?: number;
}) {
  const toast = useToast();
  const isEdit = !!contrat;

  const [clients, setClients] = useState<Utilisateur[]>([]);
  const [equipementsClient, setEquipementsClient] = useState<Equipement[]>([]);

  const [clientId, setClientId] = useState<number | ''>('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [equipementsSelectionnes, setEquipementsSelectionnes] = useState<number[]>([]);

  const [, setLoadingClients] = useState(false);
  const [loadingEquipements, setLoadingEquipements] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});

  // ── Reset à l'ouverture ──
 useEffect(() => {
  if (!open) return;
  setErreurs({});

  if (isEdit && contrat) {
    // Mode édition
    setClientId(contrat.client);
    setDateDebut(contrat.date_debut);
    setDateFin(contrat.date_fin);
    setEquipementsSelectionnes(contrat.equipements || []);
  } else {
    // Mode création avec pré-remplissage éventuel
    setClientId(clientInitial ?? '');
    setEquipementsSelectionnes(equipementsInitiaux ?? []);

    // Dates : début = aujourd'hui, fin = aujourd'hui + engagement
    if (dureeEngagementMois) {
      const aujourdhui = new Date();
      const fin = new Date(aujourdhui);
      fin.setMonth(fin.getMonth() + dureeEngagementMois);

      const iso = (d: Date) => d.toISOString().split('T')[0];
      setDateDebut(iso(aujourdhui));
      setDateFin(iso(fin));
    } else {
      setDateDebut('');
      setDateFin('');
    }
  }
}, [open, isEdit, contrat, clientInitial, equipementsInitiaux, dureeEngagementMois]);
  // ── Charger la liste des clients (une fois) ──
  useEffect(() => {
    if (!open) return;
    setLoadingClients(true);
    clientsApi.list()
      .then(setClients)
      .catch(() => toast.error('Erreur', 'Impossible de charger les clients.'))
      .finally(() => setLoadingClients(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Charger les équipements du client sélectionné ──
  useEffect(() => {
    if (!clientId) {
      setEquipementsClient([]);
      return;
    }
    setLoadingEquipements(true);
    equipementsApi.list({ client: Number(clientId) })
      .then(setEquipementsClient)
      .catch(() => toast.error('Erreur', 'Impossible de charger les équipements.'))
      .finally(() => setLoadingEquipements(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // ── Reset équipements quand on change de client (sauf en édition initiale) ──
  const handleClientChange = (val: string) => {
    const newId = val ? Number(val) : '';
    setClientId(newId);
    if (!isEdit) {
      setEquipementsSelectionnes([]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErreurs({});

    // Validations front rapides
    const nouvellesErreurs: Record<string, string> = {};
    if (!clientId) nouvellesErreurs.client = 'Sélectionnez un client.';
    if (!dateDebut) nouvellesErreurs.date_debut = 'Date de début requise.';
    if (!dateFin) nouvellesErreurs.date_fin = 'Date de fin requise.';
    if (dateDebut && dateFin && dateFin <= dateDebut) {
      nouvellesErreurs.date_fin = "La date de fin doit être après la date de début.";
    }
    if (Object.keys(nouvellesErreurs).length > 0) {
      setErreurs(nouvellesErreurs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        client: Number(clientId),
        date_debut: dateDebut,
        date_fin: dateFin,
        equipements: equipementsSelectionnes,
      };

      if (isEdit && contrat) {
        await contratsApi.update(contrat.id, payload);
        toast.success('Contrat modifié', '');
      } else {
        await contratsApi.create(payload);
        toast.success('Contrat créé', 'Le client et les équipements sont liés.');
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
        toast.error('Erreur', 'Impossible d\'enregistrer le contrat.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Modifier le contrat' : 'Nouveau contrat'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            loading={saving}
            icon={<Check size={15} />}
            disabled={!clientId || !dateDebut || !dateFin}
          >
            {isEdit ? 'Enregistrer' : 'Créer le contrat'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client */}
        <div>
         <Select
  label="Client"
  value={clientId.toString()}
  onChange={(e) => handleClientChange(e.target.value)}
  disabled={isEdit || !!clientInitial}
>
            <option value="">Choisir un client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.raison_sociale || `${c.first_name} ${c.last_name}`}
              </option>
            ))}
          </Select>
          {erreurs.client && (
            <p className="text-xs text-danger mt-1">{erreurs.client}</p>
          )}
          {(isEdit || clientInitial) && (
  <p className="text-xs text-ink-faint mt-1">
    {isEdit
      ? 'Le client ne peut pas être modifié.'
      : 'Client pré-sélectionné depuis CamTrack.'}
  </p>
)}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input
              type="date"
              label="Date de début"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              icon={<Calendar size={15} />}
            />
            {erreurs.date_debut && (
              <p className="text-xs text-danger mt-1">{erreurs.date_debut}</p>
            )}
          </div>
          <div>
            <Input
              type="date"
              label="Date de fin"
              value={dateFin}
              min={dateDebut || undefined}
              onChange={(e) => setDateFin(e.target.value)}
              icon={<Calendar size={15} />}
            />
            {erreurs.date_fin && (
              <p className="text-xs text-danger mt-1">{erreurs.date_fin}</p>
            )}
          </div>
        </div>

        {/* Équipements */}
        <div>
          <label className="block text-xs font-medium text-ink-soft mb-2">
            Équipements couverts
          </label>
          {!clientId ? (
            <div className="bg-surface rounded-md p-4 text-sm text-ink-faint text-center">
              Sélectionnez d'abord un client.
            </div>
          ) : (
            <SelecteurEquipements
              equipements={equipementsClient}
              selection={equipementsSelectionnes}
              onChange={setEquipementsSelectionnes}
              loading={loadingEquipements}
            />
          )}
          {erreurs.equipements && (
            <p className="text-xs text-danger mt-1">{erreurs.equipements}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}