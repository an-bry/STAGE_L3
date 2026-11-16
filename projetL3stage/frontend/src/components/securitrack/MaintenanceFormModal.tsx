import { useEffect, useState } from 'react';
import { maintenancesApi, equipementsApi, utilisateursApi } from '../../api/securitrack'; 
import type { Maintenance, Equipement, Utilisateur } from '../../types/securitrack';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/input';
import Select from '../ui/Select';

interface MaintenanceFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  maintenance?: Maintenance | null;
  equipementInitial?: Equipement | null;
}

export default function MaintenanceFormModal({ 
  open, onClose, onSuccess, maintenance, equipementInitial 
}: MaintenanceFormModalProps) {
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [techniciens, setTechniciens] = useState<Utilisateur[]>([]);
  
  const [equipementId, setEquipementId] = useState<number | ''>('');
  const [technicienId, setTechnicienId] = useState<number | ''>('');
  const [typeMaintenance, setTypeMaintenance] = useState<'PREVENTIVE' | 'CORRECTIVE'>('PREVENTIVE');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Charger les données
  useEffect(() => {
    if (open) {
      equipementsApi.list().then(setEquipements).catch(console.error);
      utilisateursApi.list({ role: 'TECHNICIEN' }).then(setTechniciens).catch(console.error);
    }
  }, [open]);

  // Pré-remplir
  useEffect(() => {
    if (maintenance) {
      setEquipementId(maintenance.equipement);
      setTechnicienId(maintenance.technicien || ''); 
      setTypeMaintenance(maintenance.type_maintenance as any);
      // On coupe la partie "heure" car ton modèle Django est un DateField (pas DateTime)
      setDate(maintenance.date.split('T')[0]);
    } else if (equipementInitial) {
      setEquipementId(equipementInitial.id);
      setTechnicienId('');
      setTypeMaintenance('PREVENTIVE');
      setDate('');
    } else {
      setEquipementId('');
      setTechnicienId('');
      setTypeMaintenance('PREVENTIVE');
      setDate('');
    }
  }, [maintenance, equipementInitial, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipementId || !date || !technicienId) {
      return alert("Veuillez remplir tous les champs.");
    }
    
    setLoading(true);
    try {
      const payload = {
        equipement: Number(equipementId),
        technicien: Number(technicienId),
        type_maintenance: typeMaintenance, // 👈 Ajout du champ obligatoire
        date: date, // 👈 Format "YYYY-MM-DD" (DateField)
        statut: 'PLANIFIEE',
      };

      if (maintenance) {
        await maintenancesApi.update(maintenance.id, payload);
      } else {
        await maintenancesApi.create(payload);
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Détail de l'erreur Django :", err?.response?.data);
      alert(`Erreur : ${JSON.stringify(err?.response?.data || "Erreur inconnue")}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={maintenance ? "Modifier la maintenance" : "Planifier une maintenance"}
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {maintenance ? 'Enregistrer' : 'Planifier'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-1">
        
        {/* ÉQUIPEMENT */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-ink">Équipement concerné</label>
          <Select
            value={equipementId}
            onChange={(e) => setEquipementId(Number(e.target.value))}
            disabled={!!equipementInitial}
          >
            <option value="">Sélectionner un équipement…</option>
            {equipements.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.model} - {eq.client_nom}</option>
            ))}
          </Select>
        </div>

        {/* TYPE DE MAINTENANCE (Obligatoire dans ton modèle Django) */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-ink">Type de maintenance</label>
          <Select
            value={typeMaintenance}
            onChange={(e) => setTypeMaintenance(e.target.value as any)}
          >
            <option value="PREVENTIVE">Préventive</option>
            <option value="CORRECTIVE">Corrective</option>
          </Select>
        </div>

        {/* TECHNICIEN */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-ink">Technicien assigné <span className="text-red-500">*</span></label>
          <Select
            value={technicienId}
            onChange={(e) => setTechnicienId(Number(e.target.value))}
            required
          >
            <option value="">Sélectionner un technicien…</option>
            {techniciens.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.first_name} {tech.last_name}
              </option>
            ))}
          </Select>
        </div>

        {/* DATE (DateField) */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-ink">Date d'intervention</label>
          <Input
            type="date" // 👈 On passe en "date" au lieu de "datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

      </form>
    </Modal>
  );
}