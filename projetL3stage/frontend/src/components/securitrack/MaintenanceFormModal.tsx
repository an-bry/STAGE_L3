import { type FormEvent, useEffect, useState } from 'react';
import { Calendar, Check, HardDrive} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/input';
import Select from '../ui/Select';
import { maintenancesApi, techniciensApi, equipementsApi } from '../../api/securitrack';
import type { Equipement, Maintenance, Utilisateur } from '../../types/securitrack';
import { useToast } from '../../context/ToastContext';

export default function MaintenanceFormModal({
  open,
  onClose,
  onSuccess,
  maintenance,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  maintenance?: Maintenance | null;
}) {
  const toast = useToast();
  const isEdit = !!maintenance;

  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [techniciens, setTechniciens] = useState<Utilisateur[]>([]);

  const [equipementId, setEquipementId] = useState<number | ''>('');
  const [technicienId, setTechnicienId] = useState<number | ''>('');
  const [date, setDate] = useState('');

  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});

  // ── Reset à l'ouverture ──
  useEffect(() => {
    if (!open) return;
    setErreurs({});

    if (isEdit && maintenance) {
      setEquipementId(maintenance.equipement);
      setTechnicienId(maintenance.technicien ?? '');
      setDate(maintenance.date);
    } else {
      setEquipementId('');
      setTechnicienId('');
      setDate('');
    }
  }, [open, isEdit, maintenance]);

  // ── Charger équipements + techniciens ──
  useEffect(() => {
    if (!open) return;
    setLoadingData(true);
    Promise.all([
      equipementsApi.list(),
      techniciensApi.list(),
    ])
      .then(([eq, techs]) => {
        setEquipements(eq);
        setTechniciens(techs);
      })
      .catch(() => toast.error('Erreur', 'Impossible de charger les données.'))
      .finally(() => setLoadingData(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErreurs({});

    // Validations front
    const err: Record<string, string> = {};
    if (!equipementId) err.equipement = 'Sélectionnez un équipement.';
    if (!technicienId) err.technicien = 'Sélectionnez un technicien.';
    if (!date) err.date = 'Choisissez une date.';

    // Date dans le passé ?
    if (date) {
      const aujourdhui = new Date().toISOString().split('T')[0];
      if (date < aujourdhui) err.date = 'La date ne peut pas être dans le passé.';
    }
    if (Object.keys(err).length > 0) {
      setErreurs(err);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        equipement: Number(equipementId),
        technicien: Number(technicienId),
        date,
      };

      if (isEdit && maintenance) {
        await maintenancesApi.update(maintenance.id, payload);
        toast.success('Maintenance modifiée', '');
      } else {
        await maintenancesApi.create(payload);
        toast.success('Maintenance planifiée', 'Le technicien et le client sont notifiés.');
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
        toast.error('Erreur', "Impossible d'enregistrer la maintenance.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Modifier la maintenance' : 'Planifier une maintenance'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button
            onClick={handleSubmit}
            loading={saving}
            icon={<Check size={15} />}
            disabled={!equipementId || !technicienId || !date || loadingData}
          >
            {isEdit ? 'Enregistrer' : 'Planifier'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {loadingData ? (
          <div className="text-sm text-ink-soft text-center py-6">Chargement…</div>
        ) : (
          <>
            {/* Équipement */}
            <div>
              <Select
                label="Équipement"
                value={equipementId.toString()}
                onChange={(e) => setEquipementId(e.target.value ? Number(e.target.value) : '')}
                disabled={isEdit}
              >
                <option value="">Choisir un équipement…</option>
                {equipements.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.model} — {eq.type_equipement} ({eq.client_nom})
                  </option>
                ))}
              </Select>
              {erreurs.equipement && (
                <p className="text-xs text-danger mt-1">{erreurs.equipement}</p>
              )}
              {isEdit && (
                <p className="text-xs text-ink-faint mt-1">
                  L'équipement ne peut pas être modifié.
                </p>
              )}
            </div>

            {/* Technicien */}
            <div>
              <Select
                label="Technicien"
                value={technicienId.toString()}
                onChange={(e) => setTechnicienId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Choisir un technicien…</option>
                {techniciens.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.first_name} {t.last_name}
                    {t.specialite ? ` — ${t.specialite}` : ''}
                  </option>
                ))}
              </Select>
              {erreurs.technicien && (
                <p className="text-xs text-danger mt-1">{erreurs.technicien}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <Input
                type="date"
                label="Date d'intervention"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                icon={<Calendar size={15} />}
                hint="Le serveur vérifie qu'un contrat couvre l'équipement à cette date."
              />
              {erreurs.date && (
                <p className="text-xs text-danger mt-1">{erreurs.date}</p>
              )}
            </div>

            {/* Info */}
            <div className="bg-info-soft border border-info/30 rounded-md p-3 text-xs text-info flex items-start gap-2">
              <HardDrive size={14} className="shrink-0 mt-0.5" />
              <span>
                Le technicien et le client recevront une notification automatique.
              </span>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}