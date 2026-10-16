import { type FormEvent, useEffect, useState } from 'react';
import { KeyRound, AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/input';
import { utilisateursApi } from '../../api/securitrack';
import type { Utilisateur } from '../../types/securitrack';
import { useToast } from '../../context/ToastContext';

export default function ResetMotDePasseModal({
  open,
  onClose,
  utilisateur,
}: {
  open: boolean;
  onClose: () => void;
  utilisateur: Utilisateur | null;
}) {
  const toast = useToast();
  const [mdp, setMdp] = useState('');
  const [confirme, setConfirme] = useState('');
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    if (open) { setMdp(''); setConfirme(''); setErreur(''); }
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErreur('');

    if (mdp.length < 8) { setErreur('Minimum 8 caractères.'); return; }
    if (mdp !== confirme) { setErreur('Les mots de passe ne correspondent pas.'); return; }
    if (!utilisateur) return;

    setSaving(true);
    try {
      await utilisateursApi.resetPassword(utilisateur.id, mdp);
      toast.success('Mot de passe réinitialisé', `Le nouveau mot de passe est actif pour ${utilisateur.username}.`);
      onClose();
    } catch (err: any) {
      const detail = err?.response?.data?.nouveau_mot_de_passe?.[0]
        || err?.response?.data?.detail
        || 'Impossible de réinitialiser.';
      setErreur(detail);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Réinitialiser le mot de passe"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} loading={saving} icon={<KeyRound size={15} />} disabled={!mdp || !confirme}>
            Réinitialiser
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {utilisateur && (
          <p className="text-sm text-ink-soft">
            Nouveau mot de passe pour <strong>{utilisateur.first_name} {utilisateur.last_name}</strong> ({utilisateur.username}).
          </p>
        )}

        <Input
          type="password"
          label="Nouveau mot de passe"
          value={mdp}
          onChange={(e) => setMdp(e.target.value)}
          placeholder="Minimum 8 caractères"
        />
        <Input
          type="password"
          label="Confirmer le mot de passe"
          value={confirme}
          onChange={(e) => setConfirme(e.target.value)}
        />

        {erreur && (
          <div className="bg-danger-soft border border-danger/30 rounded-md p-3 flex items-start gap-2 text-xs text-danger">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>{erreur}</span>
          </div>
        )}

        <div className="bg-warning-soft border border-warning/30 rounded-md p-3 flex items-start gap-2 text-xs text-warning">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>L'utilisateur devra se reconnecter avec ce nouveau mot de passe.</span>
        </div>
      </form>
    </Modal>
  );
}