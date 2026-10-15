import { type FormEvent, useEffect, useState } from 'react';
import {
  MessageSquare, Send, Lock, Globe,
} from 'lucide-react';
import {
  getCommentaires,
  ajouterCommentaire,
  type Commentaire,
} from '../../api/ticketService';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Textarea from '../ui/Texterea';
import UserAvatar from '../ui/UserAvatar';
import { useToast } from '../../context/ToastContext';

interface CommentairesSectionProps {
  ticketId: number;
  /** Rôle de l'utilisateur : contrôle l'affichage (INTERNE visible pour Admin/Tech, pas pour Client) */
  role: 'CLIENT' | 'ADMIN' | 'TECHNICIEN';
}

export default function CommentairesSection({
  ticketId,
  role,
}: CommentairesSectionProps) {
  const toast = useToast();

  const [commentaires, setCommentaires] = useState<Commentaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [nouveau, setNouveau] = useState('');
  const [visibilite, setVisibilite] = useState<'PUBLIC' | 'INTERNE'>('PUBLIC');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const charger = async () => {
    setLoading(true);
    try {
      const data = await getCommentaires(ticketId);
      setCommentaires(data);
    } catch {
      toast.error('Erreur', 'Impossible de charger les commentaires.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const handleEnvoyer = async (e: FormEvent) => {
    e.preventDefault();

    if (!nouveau.trim() || nouveau.trim().length < 2) {
      toast.error('Commentaire invalide', 'Minimum 2 caractères.');
      return;
    }

    setEnvoiEnCours(true);
    try {
      await ajouterCommentaire(ticketId, {
        contenu: nouveau.trim(),
        visibilite,
      });
      toast.success('Commentaire ajouté', '');
      setNouveau('');
      await charger();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || "Impossible d'envoyer.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  // Un client ne peut PAS poster en interne
  const peutChoisirInterne = role === 'ADMIN' || role === 'TECHNICIEN';

  return (
    <div className="bg-card border border-line rounded-lg p-6 space-y-4">
      <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
        <MessageSquare size={16} /> Commentaires ({commentaires.length})
      </h3>

      {/* Formulaire */}
      <form onSubmit={handleEnvoyer} className="space-y-3">
        <Textarea
          value={nouveau}
          onChange={(e) => setNouveau(e.target.value)}
          rows={3}
          placeholder="Écrivez un commentaire…"
          hint={`${nouveau.length} / 1000`}
        />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVisibilite('PUBLIC')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                visibilite === 'PUBLIC'
                  ? 'bg-primary text-white'
                  : 'bg-surface text-ink-soft hover:bg-line'
              }`}
            >
              <Globe size={12} /> Public
            </button>

            {peutChoisirInterne && (
              <button
                type="button"
                onClick={() => setVisibilite('INTERNE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  visibilite === 'INTERNE'
                    ? 'bg-warning text-white'
                    : 'bg-surface text-ink-soft hover:bg-line'
                }`}
              >
                <Lock size={12} /> Interne
              </button>
            )}
          </div>

          <Button
            type="submit"
            icon={<Send size={14} />}
            loading={envoiEnCours}
            disabled={!nouveau.trim()}
          >
            Envoyer
          </Button>
        </div>
      </form>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-6 text-sm text-ink-soft">
          Chargement des commentaires…
        </div>
      ) : commentaires.length === 0 ? (
        <div className="text-center py-6 text-sm text-ink-soft">
          Aucun commentaire pour l'instant.
        </div>
      ) : (
        <div className="space-y-3 pt-3 border-t border-line">
          {commentaires.map((c) => (
            <div
              key={c.id}
              className={`border rounded-lg p-3 ${
                c.visibilite === 'INTERNE'
                  ? 'border-warning/40 bg-warning-soft/20'
                  : 'border-line'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <UserAvatar
                    firstName={c.auteur?.first_name ?? '?'}
                    lastName={c.auteur?.last_name ?? '?'}
                    size="sm"
                  />
                  <span className="text-sm font-medium text-ink">
                    {c.auteur?.first_name ?? 'Utilisateur'}{' '}
                    {c.auteur?.last_name ?? ''}
                  </span>
                  {c.visibilite === 'INTERNE' && (
                    <Badge variant="warning" size="sm">
                      <Lock size={10} /> Interne
                    </Badge>
                  )}
                </div>

                <span className="text-xs text-ink-faint">
                  {new Date(c.date).toLocaleString('fr-FR')}
                </span>
              </div>
              <p className="text-sm text-ink whitespace-pre-wrap">{c.contenu}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}