import { type FormEvent, useEffect, useState } from 'react';
import { Check, Shield, User, Wrench } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/input';
import Select from '../ui/Select';
import { utilisateursApi } from '../../api/securitrack';
import type { RoleUtilisateur, Utilisateur } from '../../types/securitrack';
import { useToast } from '../../context/ToastContext';

const ROLES: { value: RoleUtilisateur; label: string; icon: typeof User }[] = [
  { value: 'CLIENT', label: 'Client', icon: User },
  { value: 'TECHNICIEN', label: 'Technicien', icon: Wrench },
  { value: 'ADMIN', label: 'Administrateur', icon: Shield },
];

export default function UtilisateurFormModal({
  open,
  onClose,
  onSuccess,
  utilisateur,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  utilisateur?: Utilisateur | null;
}) {
  const toast = useToast();
  const isEdit = !!utilisateur;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleUtilisateur>('CLIENT');
  const [telephone, setTelephone] = useState('');
  const [raisonSociale, setRaisonSociale] = useState('');
  const [specialite, setSpecialite] = useState('');

  const [saving, setSaving] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErreurs({});
    if (isEdit && utilisateur) {
      setUsername(utilisateur.username);
      setFirstName(utilisateur.first_name);
      setLastName(utilisateur.last_name);
      setEmail(utilisateur.email);
      setRole(utilisateur.role);
      setTelephone(utilisateur.telephone ?? '');
      setRaisonSociale(utilisateur.raison_sociale ?? '');
      setSpecialite(utilisateur.specialite ?? '');
      setPassword('');
    } else {
      setUsername('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setRole('CLIENT');
      setTelephone('');
      setRaisonSociale('');
      setSpecialite('');
    }
  }, [open, isEdit, utilisateur]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErreurs({});

    const err: Record<string, string> = {};
    if (!username.trim()) err.username = "Nom d'utilisateur requis.";
    if (!isEdit && password.length < 8) err.password = 'Minimum 8 caractères.';
    if (!email.trim()) err.email = 'Email requis.';

    if (Object.keys(err).length > 0) {
      setErreurs(err);
      return;
    }

    setSaving(true);
    try {
      if (isEdit && utilisateur) {
        await utilisateursApi.update(utilisateur.id, {
          username, first_name: firstName, last_name: lastName,
          email, telephone, raison_sociale: raisonSociale, specialite,
        });
        toast.success('Utilisateur modifié', '');
      } else {
        await utilisateursApi.create({
          username, password, first_name: firstName, last_name: lastName,
          email, role, telephone, raison_sociale: raisonSociale, specialite,
        });
        toast.success('Utilisateur créé', 'Le compte est actif immédiatement.');
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
      title={isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} loading={saving} icon={<Check size={15} />}>
            {isEdit ? 'Enregistrer' : 'Créer le compte'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identifiants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Input
              label="Nom d'utilisateur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex : jean.dupont"
            />
            {erreurs.username && <p className="text-xs text-danger mt-1">{erreurs.username}</p>}
          </div>
          {!isEdit && (
            <div>
              <Input
                type="password"
                label="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
              />
              {erreurs.password && <p className="text-xs text-danger mt-1">{erreurs.password}</p>}
            </div>
          )}
        </div>

        {/* Nom */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Input label="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>

        {/* Email */}
        <div>
          <Input type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {erreurs.email && <p className="text-xs text-danger mt-1">{erreurs.email}</p>}
        </div>

        {/* Rôle */}
        <div>
          <Select
            label="Rôle"
            value={role}
            onChange={(e) => setRole(e.target.value as RoleUtilisateur)}
            disabled={isEdit}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
          {isEdit ? (
            <p className="text-xs text-ink-faint mt-1">
              Le rôle ne peut pas être modifié après création.
            </p>
          ) : (
            <p className="text-xs text-ink-faint mt-1">
              Le rôle est définitif après création.
            </p>
          )}
        </div>

        {/* Champs conditionnels */}
        {role === 'CLIENT' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
            <Input
              label="Raison sociale"
              value={raisonSociale}
              onChange={(e) => setRaisonSociale(e.target.value)}
              placeholder="Ex : SARL Vision+"
            />
          </div>
        )}

        {role === 'TECHNICIEN' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
            <Input
              label="Spécialité"
              value={specialite}
              onChange={(e) => setSpecialite(e.target.value)}
              placeholder="Ex : Réseaux, Caméras IP…"
            />
          </div>
        )}

        {role === 'ADMIN' && (
          <Input label="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
        )}
      </form>
    </Modal>
  );
}