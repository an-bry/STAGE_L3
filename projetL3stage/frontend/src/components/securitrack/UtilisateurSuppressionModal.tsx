import { useEffect, useState } from 'react';
import { Trash2, AlertTriangle, Power, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { utilisateursApi } from '../../api/securitrack';
import type { Utilisateur } from '../../types/securitrack';
import { useToast } from '../../context/ToastContext';

interface Liens { peut_supprimer: boolean; liens: Record<string, number>; }

export default function UtilisateurSuppressionModal({
  open,
  onClose,
  onSuccess,
  utilisateur,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  utilisateur: Utilisateur | null;
}) {
  const toast = useToast();
  const [liens, setLiens] = useState<Liens | null>(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState(false);

  useEffect(() => {
    if (!open || !utilisateur) { setLiens(null); return; }
    setLoading(true);
    utilisateursApi.liens(utilisateur.id)
      .then(setLiens)
      .catch(() => toast.error('Erreur', 'Impossible de vérifier les liens.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, utilisateur]);

  const handleSupprimer = async () => {
    if (!utilisateur) return;
    setAction(true);
    try {
      await utilisateursApi.delete(utilisateur.id);
      toast.success('Utilisateur supprimé', '');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || 'Impossible de supprimer.');
    } finally {
      setAction(false);
    }
  };

  const handleDesactiver = async () => {
    if (!utilisateur) return;
    setAction(true);
    try {
      await utilisateursApi.update(utilisateur.id, { is_active: false });
      toast.success('Utilisateur désactivé', 'Il ne peut plus se connecter.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || 'Impossible de désactiver.');
    } finally {
      setAction(false);
    }
  };

  const nbLiens = liens ? Object.values(liens.liens).reduce((a, b) => a + b, 0) : 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={liens?.peut_supprimer ? 'Supprimer l\'utilisateur' : 'Données liées'}
      size="md"
      footer={
        loading ? null : liens?.peut_supprimer ? (
          <>
            <Button variant="secondary" onClick={onClose}>Annuler</Button>
            <Button variant="danger" onClick={handleSupprimer} loading={action} icon={<Trash2 size={15} />}>
              Supprimer définitivement
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>Annuler</Button>
            <Button variant="secondary" onClick={handleDesactiver} loading={action} icon={<Power size={15} />}>
              Désactiver à la place
            </Button>
          </>
        )
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-ink-soft text-sm">
          <Loader2 size={16} className="animate-spin" /> Vérification des liens…
        </div>
      ) : !liens ? (
        <p className="text-sm text-danger">Impossible de vérifier.</p>
      ) : liens.peut_supprimer ? (
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">
            Voulez-vous vraiment supprimer{' '}
            <strong>{utilisateur?.first_name} {utilisateur?.last_name}</strong>{' '}
            ({utilisateur?.username}) ?
          </p>
          <div className="bg-danger-soft border border-danger/30 rounded-md p-3 flex items-start gap-2 text-xs text-danger">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>Aucune donnée n'est liée à cet utilisateur. Cette action est irréversible.</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">
            <strong>{utilisateur?.first_name} {utilisateur?.last_name}</strong> a{' '}
            <strong>{nbLiens}</strong> donnée{nbLiens > 1 ? 's' : ''} liée{nbLiens > 1 ? 's' : ''} :
          </p>

          <div className="border border-line rounded-md divide-y divide-line">
            {Object.entries(liens.liens).map(([table, n]) => (
              <div key={table} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-ink-soft">{table}</span>
                <span className="font-medium text-ink">{n}</span>
              </div>
            ))}
          </div>

          <div className="bg-warning-soft border border-warning/30 rounded-md p-3 flex items-start gap-2 text-xs text-warning">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>
              La suppression est bloquée pour préserver l'historique.
              Désactivez le compte à la place : l'utilisateur ne pourra plus se connecter,
              mais ses données restent intactes.
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
}