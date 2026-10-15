import { type FormEvent, useEffect, useState } from 'react';
import {
  FileText, Check, X, Send, Plus, Trash2, AlertTriangle,
  Pencil,
} from 'lucide-react';
import {
  getDevisTicket,
  creerDevis,
  modifierDevis,
  envoyerDevis,
  accepterDevis,
  refuserDevis,
  type Devis,
  type LigneDevisInput,
} from '../../api/ticketService';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/input';
import Textarea from '../ui/Texterea';
import Modal from '../ui/Modal';
import { useToast } from '../../context/ToastContext';

interface DevisSectionProps {
  ticketId: number;
  role: 'CLIENT' | 'ADMIN';
  /** Callback appelé quand un devis change de statut (pour rafraîchir la page parente) */
  onUpdate?: () => void;
}

const STATUT_CONFIG: Record<
  Devis['statut'],
  { label: string; variant: 'neutral' | 'info' | 'success' | 'danger' }
> = {
  BROUILLON: { label: 'Brouillon', variant: 'neutral' },
  ENVOYE: { label: 'Envoyé — en attente de validation', variant: 'info' },
  ACCEPTE: { label: 'Accepté', variant: 'success' },
  REFUSE: { label: 'Refusé', variant: 'danger' },
};

function formatAriary(v: number) {
  return `${v.toLocaleString('fr-FR')} Ar`;
}

export default function DevisSection({ ticketId, role, onUpdate }: DevisSectionProps) {
  const toast = useToast();

  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionEnCours, setActionEnCours] = useState(false);

  // Modales
  const [editOpen, setEditOpen] = useState(false);
  const [refusOpen, setRefusOpen] = useState(false);

  // Formulaire devis (Admin)
  const [lignes, setLignes] = useState<LigneDevisInput[]>([
    { designation: '', quantite: 1, prix_unitaire: 0 },
  ]);
  const [mainOeuvre, setMainOeuvre] = useState(0);
  const [remise, setRemise] = useState(0);
  const [commentaire, setCommentaire] = useState('');

  // Refus (Client)
  const [motifRefus, setMotifRefus] = useState('');

  const charger = async () => {
    setLoading(true);
    try {
      const data = await getDevisTicket(ticketId);
      setDevis(data);
    } catch (err: any) {
      // 403 = technicien, on n'affiche rien
      if (err?.response?.status !== 403) {
        toast.error('Erreur', 'Impossible de charger les devis.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const devisCourant = devis[0] || null; // Le plus récent (revision DESC)

  // === Admin : créer / modifier ===
  const ouvrirEdition = (devis?: Devis) => {
    if (devis) {
      setLignes(
        devis.lignes.map((l) => ({
          piece: l.piece,
          designation: l.designation,
          quantite: l.quantite,
          prix_unitaire: l.prix_unitaire,
        }))
      );
      setMainOeuvre(devis.montant_main_oeuvre);
      setRemise(devis.remise);
      setCommentaire(devis.commentaire);
    } else {
      setLignes([{ designation: '', quantite: 1, prix_unitaire: 0 }]);
      setMainOeuvre(0);
      setRemise(0);
      setCommentaire('');
    }
    setEditOpen(true);
  };

  const ajouterLigne = () => {
    setLignes([...lignes, { designation: '', quantite: 1, prix_unitaire: 0 }]);
  };

  const supprimerLigne = (idx: number) => {
    if (lignes.length === 1) return;
    setLignes(lignes.filter((_, i) => i !== idx));
  };

  const modifierLigne = (
    idx: number,
    champ: keyof LigneDevisInput,
    valeur: string | number
  ) => {
    const nouvelles = [...lignes];
    nouvelles[idx] = { ...nouvelles[idx], [champ]: valeur };
    setLignes(nouvelles);
  };

  const totalLignes = lignes.reduce(
    (acc, l) => acc + (l.quantite || 0) * (l.prix_unitaire || 0),
    0
  );
  const total = Math.max(totalLignes + mainOeuvre - remise, 0);

  const handleSauver = async (e: FormEvent) => {
    e.preventDefault();

    const lignesValides = lignes.filter(
      (l) => l.designation && l.designation.trim().length >= 2 && l.quantite >= 1
    );

    if (lignesValides.length === 0 && mainOeuvre <= 0) {
      toast.error('Devis vide', 'Ajoutez au moins une ligne ou de la main d\'œuvre.');
      return;
    }

    setActionEnCours(true);
    try {
      if (devisCourant && devisCourant.statut === 'BROUILLON') {
        await modifierDevis(devisCourant.id, {
          lignes: lignesValides,
          montant_main_oeuvre: mainOeuvre,
          remise,
          commentaire,
        });
        toast.success('Devis modifié', '');
      } else {
        await creerDevis(ticketId, {
          lignes: lignesValides,
          montant_main_oeuvre: mainOeuvre,
          remise,
          commentaire,
        });
        toast.success('Devis créé', '');
      }
      setEditOpen(false);
      await charger();
      onUpdate?.();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || 'Impossible de sauvegarder.');
    } finally {
      setActionEnCours(false);
    }
  };

  const handleEnvoyer = async () => {
    if (!devisCourant) return;
    setActionEnCours(true);
    try {
      await envoyerDevis(devisCourant.id);
      toast.success('Devis envoyé', 'Le client a été notifié.');
      await charger();
      onUpdate?.();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || "Impossible d'envoyer.");
    } finally {
      setActionEnCours(false);
    }
  };

  // === Client : accepter / refuser ===
  const handleAccepter = async () => {
    if (!devisCourant) return;
    if (!confirm(`Accepter le devis de ${formatAriary(devisCourant.montant_total)} ?`)) return;

    setActionEnCours(true);
    try {
      await accepterDevis(devisCourant.id);
      toast.success('Devis accepté', "L'intervention peut démarrer.");
      await charger();
      onUpdate?.();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || "Impossible d'accepter.");
    } finally {
      setActionEnCours(false);
    }
  };

  const handleRefuser = async (e: FormEvent) => {
    e.preventDefault();
    if (!devisCourant) return;

    if (!motifRefus.trim() || motifRefus.trim().length < 5) {
      toast.error('Motif requis', 'Minimum 5 caractères.');
      return;
    }

    setActionEnCours(true);
    try {
      await refuserDevis(devisCourant.id, motifRefus.trim());
      toast.success('Devis refusé', "L'Admin a été notifié.");
      setRefusOpen(false);
      setMotifRefus('');
      await charger();
      onUpdate?.();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || 'Impossible de refuser.');
    } finally {
      setActionEnCours(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return (
      <div className="bg-card border border-line rounded-lg p-6 text-sm text-ink-soft text-center">
        Chargement du devis…
      </div>
    );
  }

  // Aucun devis
   // Aucun devis
  if (!devisCourant) {
    return (
      <>
        <div className="bg-card border border-line rounded-lg p-6 space-y-3">
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
            <FileText size={16} /> Devis
          </h3>
          <p className="text-sm text-ink-soft">
            {role === 'ADMIN'
              ? "Aucun devis n'a encore été établi pour ce ticket."
              : "Aucun devis n'est disponible pour le moment."}
          </p>
          {role === 'ADMIN' && (
            <Button
              icon={<Plus size={15} />}
              onClick={() => ouvrirEdition()}
            >
              Établir un devis
            </Button>
          )}
        </div>

        {/* ✅ MODALE ICI (elle était manquante !) */}
        <Modal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title="Établir un devis"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSauver} loading={actionEnCours} icon={<Check size={15} />}>
                Enregistrer ({formatAriary(total)})
              </Button>
            </>
          }
        >
          <form onSubmit={handleSauver} className="space-y-4">
            {/* Lignes */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-ink">Lignes</label>
              {lignes.map((l, idx) => (
                <div
                  key={idx}
                  className="bg-surface rounded-md p-3 grid grid-cols-12 gap-2 items-end"
                >
                  <div className="col-span-5">
                    <Input
                      placeholder="Désignation"
                      value={l.designation || ''}
                      onChange={(e) => modifierLigne(idx, 'designation', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={1}
                      placeholder="Qté"
                      value={l.quantite}
                      onChange={(e) =>
                        modifierLigne(idx, 'quantite', Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      placeholder="Prix"
                      value={l.prix_unitaire || 0}
                      onChange={(e) =>
                        modifierLigne(idx, 'prix_unitaire', Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => supprimerLigne(idx)}
                      disabled={lignes.length === 1}
                      className="p-2 rounded text-danger hover:bg-danger-soft transition-colors disabled:opacity-30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                icon={<Plus size={15} />}
                onClick={ajouterLigne}
                fullWidth
              >
                Ajouter une ligne
              </Button>
            </div>

            {/* Main d'œuvre + remise */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Main d'œuvre (Ar)"
                min={0}
                value={mainOeuvre}
                onChange={(e) => setMainOeuvre(Number(e.target.value))}
              />
              <Input
                type="number"
                label="Remise (Ar)"
                min={0}
                value={remise}
                onChange={(e) => setRemise(Number(e.target.value))}
              />
            </div>

            <Textarea
              label="Commentaire (optionnel)"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={2}
              placeholder="Commentaire visible par le client…"
            />

            <div className="border-t border-line pt-4 flex items-center justify-between">
              <span className="text-sm font-medium text-ink">Total</span>
              <span className="text-xl font-bold text-primary">
                {formatAriary(total)}
              </span>
            </div>
          </form>
        </Modal>
      </>
    );
  }
  // Devis existant
  const conf = STATUT_CONFIG[devisCourant.statut];

  return (
    <>
      <div className="bg-card border border-line rounded-lg p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
              <FileText size={16} /> Devis #{devisCourant.revision}
            </h3>
            <p className="text-xs text-ink-soft mt-0.5">
              Établi le{' '}
              {new Date(devisCourant.date_creation).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <Badge variant={conf.variant} dot>
            {conf.label}
          </Badge>
        </div>

        {/* Lignes */}
        <div className="border border-line rounded-md divide-y divide-line">
          {devisCourant.lignes.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between px-3 py-2 text-sm"
            >
              <div>
                <p className="text-ink">{l.designation}</p>
                <p className="text-xs text-ink-soft">
                  {l.quantite} × {formatAriary(l.prix_unitaire)}
                </p>
              </div>
              <span className="text-ink font-medium">
                {formatAriary(l.sous_total)}
              </span>
            </div>
          ))}

          {devisCourant.montant_main_oeuvre > 0 && (
            <div className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-ink">Main d'œuvre</span>
              <span className="text-ink font-medium">
                {formatAriary(devisCourant.montant_main_oeuvre)}
              </span>
            </div>
          )}

          {devisCourant.remise > 0 && (
            <div className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-danger">Remise</span>
              <span className="text-danger font-medium">
                -{formatAriary(devisCourant.remise)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between px-3 py-3 bg-surface">
            <span className="text-sm font-semibold text-ink">Total</span>
            <span className="text-base font-bold text-primary">
              {formatAriary(devisCourant.montant_total)}
            </span>
          </div>
        </div>

        {/* Commentaire */}
        {devisCourant.commentaire && (
          <p className="text-sm text-ink-soft bg-surface rounded-md p-3">
            {devisCourant.commentaire}
          </p>
        )}

        {/* Motif refus */}
        {devisCourant.statut === 'REFUSE' && devisCourant.motif_refus && (
          <div className="bg-danger-soft border border-danger/30 rounded-md p-3 text-xs text-danger">
            <strong>Motif du refus :</strong> {devisCourant.motif_refus}
          </div>
        )}

        {/* Actions Admin */}
        {role === 'ADMIN' && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-line">
            {devisCourant.statut === 'BROUILLON' && (
              <>
                <Button
                  variant="secondary"
                  icon={<Pencil size={15} />}
                  onClick={() => ouvrirEdition(devisCourant)}
                >
                  Modifier
                </Button>
                <Button
                  icon={<Send size={15} />}
                  onClick={handleEnvoyer}
                  loading={actionEnCours}
                  disabled={devisCourant.montant_total <= 0}
                >
                  Envoyer au client
                </Button>
              </>
            )}
            {(devisCourant.statut === 'REFUSE') && (
              <Button
                icon={<Plus size={15} />}
                onClick={() => ouvrirEdition()}
              >
                Établir un devis révisé
              </Button>
            )}
          </div>
        )}

        {/* Actions Client */}
        {role === 'CLIENT' && devisCourant.statut === 'ENVOYE' && (
          <div className="flex gap-2 pt-2 border-t border-line">
            <Button
              variant="danger"
              icon={<X size={15} />}
              onClick={() => setRefusOpen(true)}
              disabled={actionEnCours}
            >
              Refuser
            </Button>
            <Button
              variant="success"
              icon={<Check size={15} />}
              onClick={handleAccepter}
              loading={actionEnCours}
              fullWidth
            >
              Accepter le devis
            </Button>
          </div>
        )}
      </div>

      {/* Modale édition (Admin) */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={devisCourant ? 'Modifier le devis' : 'Établir un devis'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSauver} loading={actionEnCours} icon={<Check size={15} />}>
              Enregistrer ({formatAriary(total)})
            </Button>
          </>
        }
      >
        <form onSubmit={handleSauver} className="space-y-4">
          {/* Lignes */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-ink">Lignes</label>
            {lignes.map((l, idx) => (
              <div
                key={idx}
                className="bg-surface rounded-md p-3 grid grid-cols-12 gap-2 items-end"
              >
                <div className="col-span-5">
                  <Input
                    placeholder="Désignation"
                    value={l.designation || ''}
                    onChange={(e) => modifierLigne(idx, 'designation', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Qté"
                    value={l.quantite}
                    onChange={(e) =>
                      modifierLigne(idx, 'quantite', Number(e.target.value))
                    }
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    placeholder="Prix"
                    value={l.prix_unitaire || 0}
                    onChange={(e) =>
                      modifierLigne(idx, 'prix_unitaire', Number(e.target.value))
                    }
                  />
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => supprimerLigne(idx)}
                    disabled={lignes.length === 1}
                    className="p-2 rounded text-danger hover:bg-danger-soft transition-colors disabled:opacity-30"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              icon={<Plus size={15} />}
              onClick={ajouterLigne}
              fullWidth
            >
              Ajouter une ligne
            </Button>
          </div>

          {/* Main d'œuvre + remise */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Main d'œuvre (Ar)"
              min={0}
              value={mainOeuvre}
              onChange={(e) => setMainOeuvre(Number(e.target.value))}
            />
            <Input
              type="number"
              label="Remise (Ar)"
              min={0}
              value={remise}
              onChange={(e) => setRemise(Number(e.target.value))}
            />
          </div>

          <Textarea
            label="Commentaire (optionnel)"
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            rows={2}
            placeholder="Commentaire visible par le client…"
          />

          <div className="border-t border-line pt-4 flex items-center justify-between">
            <span className="text-sm font-medium text-ink">Total</span>
            <span className="text-xl font-bold text-primary">
              {formatAriary(total)}
            </span>
          </div>
        </form>
      </Modal>

      {/* Modale refus (Client) */}
      <Modal
        open={refusOpen}
        onClose={() => setRefusOpen(false)}
        title="Refuser le devis"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRefusOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleRefuser}
              loading={actionEnCours}
              icon={<X size={15} />}
            >
              Confirmer le refus
            </Button>
          </>
        }
      >
        <form onSubmit={handleRefuser} className="space-y-4">
          <div className="bg-warning-soft border border-warning/30 rounded-md p-3 flex items-start gap-2 text-xs text-warning">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>
              En refusant ce devis, un nouveau devis révisé sera établi par l'administrateur.
            </span>
          </div>

          <Textarea
            label="Motif du refus (obligatoire)"
            value={motifRefus}
            onChange={(e) => setMotifRefus(e.target.value)}
            rows={3}
            placeholder="Expliquez pourquoi vous refusez ce devis…"
            hint={`${motifRefus.length} / 500 (min 5)`}
          />
        </form>
      </Modal>
    </>
  );
}