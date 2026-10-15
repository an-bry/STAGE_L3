import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Package, Plus, Trash2, Search, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import {
  getPiecesDemandees,
  ajouterPieceDemandee,
  supprimerPieceDemandee,
  getCataloguePieces,
  type PieceDemandee,
  type PieceCatalogue,
} from '../../api/ticketService';

import Button from '../ui/Button';
import Input from '../ui/input';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { useToast } from '../../context/ToastContext';

interface PieceDemandeeSectionProps {
  interventionId: number;
  /** false = lecture seule (diagnostic déjà soumis) */
  editable: boolean;
  /** Appelé quand la liste change (utile pour rafraîchir la page parente) */
  onChange?: () => void;
}

export default function PieceDemandeeSection({
  interventionId,
  editable,
  onChange,
}: PieceDemandeeSectionProps) {
  const toast = useToast();

  const [pieces, setPieces] = useState<PieceDemandee[]>([]);
  const [catalogue, setCatalogue] = useState<PieceCatalogue[]>([]);
  const [loading, setLoading] = useState(true);

  // Modale d'ajout
  const [ajoutOpen, setAjoutOpen] = useState(false);
  const [mode, setMode] = useState<'catalogue' | 'libre'>('catalogue');
  const [recherche, setRecherche] = useState('');
  const [pieceChoisie, setPieceChoisie] = useState<PieceCatalogue | null>(null);
  const [nomLibre, setNomLibre] = useState('');
  const [refLibre, setRefLibre] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const charger = async () => {
    setLoading(true);
    try {
      const [piecesData, catalogueData] = await Promise.all([
        getPiecesDemandees(interventionId),
        getCataloguePieces().catch(() => []),
      ]);
      setPieces(piecesData);
      setCatalogue(catalogueData);
    } catch {
      toast.error('Erreur', 'Impossible de charger les pièces demandées.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interventionId]);

  // Filtrage du catalogue
  const catalogueFiltre = useMemo(() => {
    if (!recherche.trim()) return catalogue.slice(0, 20);
    const q = recherche.toLowerCase();
    return catalogue
      .filter(
        (p) =>
          p.designation.toLowerCase().includes(q) ||
          p.reference.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [catalogue, recherche]);

  const resetForm = () => {
    setMode('catalogue');
    setRecherche('');
    setPieceChoisie(null);
    setNomLibre('');
    setRefLibre('');
    setQuantite(1);
  };

  const handleAjouter = async (e: FormEvent) => {
    e.preventDefault();

    if (mode === 'catalogue' && !pieceChoisie) {
      toast.error('Pièce manquante', 'Choisissez une pièce du catalogue.');
      return;
    }
    if (mode === 'libre' && (!nomLibre.trim() || nomLibre.trim().length < 2)) {
      toast.error('Nom invalide', 'Minimum 2 caractères.');
      return;
    }
    if (quantite < 1) {
      toast.error('Quantité invalide', 'Minimum 1.');
      return;
    }

    setEnvoiEnCours(true);
    try {
      if (mode === 'catalogue' && pieceChoisie) {
        await ajouterPieceDemandee(interventionId, {
          piece: pieceChoisie.id,
          quantite,
        });
      } else {
        await ajouterPieceDemandee(interventionId, {
          nom: nomLibre.trim(),
          reference: refLibre.trim(),
          quantite,
        });
      }
      toast.success('Pièce demandée ajoutée', '');
      setAjoutOpen(false);
      resetForm();
      await charger();
      onChange?.();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || "Impossible d'ajouter.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const handleSupprimer = async (pieceId: number) => {
    if (!confirm('Retirer cette pièce de la liste ?')) return;
    try {
      await supprimerPieceDemandee(pieceId);
      setPieces((prev) => prev.filter((p) => p.id !== pieceId));
      toast.success('Pièce retirée', '');
      onChange?.();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || 'Impossible de retirer.');
    }
  };

  return (
    <>
      <div className="bg-card border border-line rounded-lg p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
              <Package size={16} /> Pièces nécessaires ({pieces.length})
            </h3>
            <p className="text-xs text-ink-soft mt-1">
              Citez les pièces à prévoir. <strong>Aucun prix</strong> — l'Admin chiffrera
              dans le devis.
            </p>
          </div>

          {editable && (
            <Button
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setAjoutOpen(true)}
            >
              Ajouter une pièce
            </Button>
          )}
        </div>

        {!editable && (
          <div className="bg-info-soft border border-info/30 rounded-md p-3 flex items-start gap-2 text-xs text-info">
            <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
            <span>Le diagnostic est soumis, la liste est figée.</span>
          </div>
        )}

        {/* Liste */}
        {loading ? (
          <div className="text-center py-6 text-sm text-ink-soft">Chargement…</div>
        ) : pieces.length === 0 ? (
          <EmptyState
            icon={<Package size={24} />}
            title="Aucune pièce demandée"
            description={
              editable
                ? "Ajoutez les pièces nécessaires avant de soumettre votre diagnostic."
                : 'Aucune pièce n\'a été mentionnée.'
            }
          />
        ) : (
          <div className="border border-line rounded-md divide-y divide-line">
            {pieces.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-3 py-2.5 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-ink font-medium">{p.nom}</p>
                  <p className="text-xs text-ink-soft">
                    {p.reference && `Réf. ${p.reference} • `}
                    Quantité demandée : {p.quantite}
                  </p>
                </div>

                {editable && (
                  <button
                    onClick={() => handleSupprimer(p.id)}
                    className="p-1.5 rounded text-ink-faint hover:bg-danger-soft hover:text-danger transition-colors"
                    title="Retirer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modale d'ajout */}
      <Modal
        open={ajoutOpen}
        onClose={() => setAjoutOpen(false)}
        title="Ajouter une pièce demandée"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setAjoutOpen(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAjouter}
              loading={envoiEnCours}
              icon={<Plus size={15} />}
            >
              Ajouter
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Toggle Catalogue / Libre */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('catalogue');
                setPieceChoisie(null);
              }}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'catalogue'
                  ? 'bg-primary text-white'
                  : 'bg-surface text-ink-soft hover:bg-line'
              }`}
            >
              Catalogue
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('libre');
                setPieceChoisie(null);
              }}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'libre'
                  ? 'bg-primary text-white'
                  : 'bg-surface text-ink-soft hover:bg-line'
              }`}
            >
              Pièce libre
            </button>
          </div>

          {/* Mode catalogue */}
          {mode === 'catalogue' && !pieceChoisie && (
            <div className="space-y-3">
              <Input
                placeholder="Rechercher une pièce (nom, référence)…"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                icon={<Search size={15} />}
              />

              <div className="border border-line rounded-md max-h-64 overflow-y-auto divide-y divide-line">
                {catalogueFiltre.length === 0 ? (
                  <p className="text-sm text-ink-soft text-center py-6">
                    Aucune pièce trouvée.
                  </p>
                ) : (
                  catalogueFiltre.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPieceChoisie(p);
                        setQuantite(1);
                      }}
                      className="w-full text-left px-3 py-2.5 hover:bg-surface transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-ink truncate">
                            {p.designation}
                          </p>
                          <p className="text-xs text-ink-soft">
                            Réf. {p.reference} • Stock : {p.stock_actuel}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Pièce sélectionnée */}
          {mode === 'catalogue' && pieceChoisie && (
            <div className="bg-surface rounded-md p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {pieceChoisie.designation}
                  </p>
                  <p className="text-xs text-ink-soft">
                    Réf. {pieceChoisie.reference} • Stock : {pieceChoisie.stock_actuel}
                  </p>
                </div>
                <button
                  onClick={() => setPieceChoisie(null)}
                  className="p-1 rounded text-ink-soft hover:bg-line"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <Input
                type="number"
                label="Quantité demandée"
                min={1}
                value={quantite}
                onChange={(e) => setQuantite(Number(e.target.value))}
                hint="Le stock ne sera pas décrémenté — c'est juste une estimation."
              />
            </div>
          )}

          {/* Mode pièce libre */}
          {mode === 'libre' && (
            <div className="space-y-3">
              <Input
                label="Nom de la pièce"
                value={nomLibre}
                onChange={(e) => setNomLibre(e.target.value)}
                placeholder="Ex : Toner HP 26A"
              />
              <Input
                label="Référence (optionnel)"
                value={refLibre}
                onChange={(e) => setRefLibre(e.target.value)}
                placeholder="Ex : HP26A-2026"
              />
              <Input
                type="number"
                label="Quantité demandée"
                min={1}
                value={quantite}
                onChange={(e) => setQuantite(Number(e.target.value))}
              />
            </div>
          )}

          <div className="bg-info-soft border border-info/30 rounded-md p-3 flex items-start gap-2 text-xs text-info">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>
              Aucun prix ne sera visible ici. L'Admin fixera les prix dans le devis.
            </span>
          </div>
        </div>
      </Modal>
    </>
  );
}