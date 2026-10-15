import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Plus, Package, Search, Edit, Trash2, Eye, EyeOff,
  Camera, Check, 
} from 'lucide-react';
import {
  getOffresAdmin,
  creerOffre,
  modifierOffre,
  supprimerOffre,
} from '../../../api/camtrackService';
import type { Offre, OffreCreateData } from '../../../types/camtrack';
import AppShell from '../../../components/layout/AppShell';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/input';
import Textarea from '../../../components/ui/Texterea';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import EmptyState from '../../../components/ui/EmptyState';
import { useToast } from '../../../context/ToastContext';

function formatAriary(v: number) {
  return `${v.toLocaleString('fr-FR')} Ar`;
}

const FORM_VIDE: OffreCreateData = {
  nom: '',
  description: '',
  nombre_cameras_inclus: 4,
  prix_abonnement: 100000,
  duree_engagement_mois: 12,
  actif: true,
};

export default function OffresAdminPage() {
  const toast = useToast();

  const [offres, setOffres] = useState<Offre[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreActif, setFiltreActif] = useState<'toutes' | 'actives' | 'inactives'>(
    'toutes'
  );

  // Modales
  const [formOpen, setFormOpen] = useState(false);
  const [offreEnEdition, setOffreEnEdition] = useState<Offre | null>(null);
  const [form, setForm] = useState<OffreCreateData>(FORM_VIDE);
  const [saving, setSaving] = useState(false);

  const [confirmSuppr, setConfirmSuppr] = useState<Offre | null>(null);

  const charger = async () => {
    setLoading(true);
    try {
      const data = await getOffresAdmin();
      setOffres(data);
    } catch {
      toast.error('Erreur', 'Impossible de charger les offres.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtre + recherche + tri
  const offresAffichees = useMemo(() => {
    let base = [...offres].sort((a, b) => b.id - a.id);

    if (filtreActif === 'actives') base = base.filter((o) => o.actif);
    if (filtreActif === 'inactives') base = base.filter((o) => !o.actif);

    if (recherche.trim()) {
      const q = recherche.toLowerCase();
      base = base.filter(
        (o) =>
          o.nom.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q)
      );
    }
    return base;
  }, [offres, filtreActif, recherche]);

  // Stats
  const stats = useMemo(
    () => ({
      total: offres.length,
      actives: offres.filter((o) => o.actif).length,
      inactives: offres.filter((o) => !o.actif).length,
    }),
    [offres]
  );

  // Ouvrir modale création
  const ouvrirCreation = () => {
    setOffreEnEdition(null);
    setForm(FORM_VIDE);
    setFormOpen(true);
  };

  // Ouvrir modale édition
  const ouvrirEdition = (offre: Offre) => {
    setOffreEnEdition(offre);
    setForm({
      nom: offre.nom,
      description: offre.description,
      nombre_cameras_inclus: offre.nombre_cameras_inclus,
      prix_abonnement: offre.prix_abonnement,
      duree_engagement_mois: offre.duree_engagement_mois,
      actif: offre.actif,
    });
    setFormOpen(true);
  };

  // Sauvegarder (création ou édition)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.nom.trim() || form.nom.trim().length < 2) {
      toast.error('Nom invalide', 'Minimum 2 caractères.');
      return;
    }
    if (form.nombre_cameras_inclus < 1) {
      toast.error('Nombre de caméras invalide', 'Minimum 1.');
      return;
    }
    if (form.prix_abonnement <= 0) {
      toast.error('Prix invalide', 'Doit être supérieur à 0.');
      return;
    }

    setSaving(true);
    try {
      if (offreEnEdition) {
        await modifierOffre(offreEnEdition.id, form);
        toast.success('Offre modifiée', '');
      } else {
        await creerOffre(form);
        toast.success('Offre créée', '');
      }
      setFormOpen(false);
      await charger();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || 'Impossible de sauvegarder.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle actif/inactif
  const handleToggleActif = async (offre: Offre) => {
    try {
      await modifierOffre(offre.id, { actif: !offre.actif });
      setOffres((prev) =>
        prev.map((o) => (o.id === offre.id ? { ...o, actif: !o.actif } : o))
      );
      toast.success(
        offre.actif ? 'Offre désactivée' : 'Offre activée',
        ''
      );
    } catch {
      toast.error('Erreur', "Impossible de modifier l'état.");
    }
  };

  // Supprimer (soft delete via DELETE)
  const handleSupprimer = async () => {
    if (!confirmSuppr) return;
    try {
      await supprimerOffre(confirmSuppr.id);
      toast.success('Offre désactivée', '');
      setConfirmSuppr(null);
      await charger();
    } catch {
      toast.error('Erreur', 'Impossible de supprimer.');
    }
  };

  return (
    <AppShell
      title="Gestion des offres"
      breadcrumb={['NjCam', 'CamTrack', 'Offres']}
      actions={
        <Button icon={<Plus size={16} />} onClick={ouvrirCreation}>
          Nouvelle offre
        </Button>
      }
    >
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary-soft text-primary">
              <Package size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">Total</p>
              <p className="text-xl font-semibold text-ink">{stats.total}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-success-soft text-success">
              <Check size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">Actives</p>
              <p className="text-xl font-semibold text-ink">{stats.actives}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-surface text-ink-soft">
              <EyeOff size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-soft">Inactives</p>
              <p className="text-xl font-semibold text-ink">{stats.inactives}</p>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Rechercher une offre…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              icon={<Search size={15} />}
            />
          </div>
          <div className="flex gap-2">
            {(['toutes', 'actives', 'inactives'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltreActif(f)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filtreActif === f
                    ? 'bg-primary text-white'
                    : 'bg-card border border-line text-ink-soft hover:text-ink'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="bg-card border border-line rounded-lg p-12 text-center text-sm text-ink-soft">
            Chargement des offres…
          </div>
        ) : offres.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Package size={24} />}
              title="Aucune offre"
              description="Créez votre première offre pour commencer."
              action={
                <Button icon={<Plus size={16} />} onClick={ouvrirCreation}>
                  Créer une offre
                </Button>
              }
            />
          </div>
        ) : offresAffichees.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Search size={24} />}
              title="Aucun résultat"
              description="Aucune offre ne correspond à ces critères."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offresAffichees.map((offre) => (
              <div
                key={offre.id}
                className={`bg-card border rounded-lg p-5 flex flex-col transition-all ${
                  offre.actif ? 'border-line' : 'border-line opacity-60'
                }`}
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-md bg-primary-soft shrink-0">
                    <Camera size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-semibold text-ink truncate">
                        {offre.nom}
                      </h3>
                      <Badge variant={offre.actif ? 'success' : 'neutral'} size="sm" dot>
                        {offre.actif ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {offre.description && (
                  <p className="text-xs text-ink-soft mb-3 line-clamp-2">
                    {offre.description}
                  </p>
                )}

                {/* Specs */}
                <div className="space-y-1.5 mb-4 text-sm flex-1">
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Caméras</span>
                    <span className="text-ink font-medium">
                      {offre.nombre_cameras_inclus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Engagement</span>
                    <span className="text-ink font-medium">
                      {offre.duree_engagement_mois} mois
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-line">
                    <span className="text-ink-soft">Prix</span>
                    <span className="text-ink font-semibold">
                      {formatAriary(offre.prix_abonnement)}/mois
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 pt-3 border-t border-line">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Edit size={13} />}
                    onClick={() => ouvrirEdition(offre)}
                    fullWidth
                  >
                    Modifier
                  </Button>
                  <button
                    onClick={() => handleToggleActif(offre)}
                    className="p-2 rounded text-ink-soft hover:bg-surface hover:text-ink transition-colors"
                    title={offre.actif ? 'Désactiver' : 'Activer'}
                  >
                    {offre.actif ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button
                    onClick={() => setConfirmSuppr(offre)}
                    className="p-2 rounded text-danger hover:bg-danger-soft transition-colors"
                    title="Désactiver définitivement"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modale Form */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={offreEnEdition ? "Modifier l'offre" : 'Nouvelle offre'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              loading={saving}
              icon={<Check size={15} />}
            >
              {offreEnEdition ? 'Enregistrer' : 'Créer'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom de l'offre"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            placeholder="Ex : Pack Essentiel"
          />

          <Textarea
            label="Description"
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Décrivez les caractéristiques de l'offre…"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Caméras incluses"
              value={form.nombre_cameras_inclus}
              min={1}
              onChange={(e) =>
                setForm({ ...form, nombre_cameras_inclus: Number(e.target.value) })
              }
            />
            <Input
              type="number"
              label="Engagement (mois)"
              value={form.duree_engagement_mois}
              min={1}
              onChange={(e) =>
                setForm({ ...form, duree_engagement_mois: Number(e.target.value) })
              }
            />
          </div>

          <Input
            type="number"
            label="Prix mensuel (Ar)"
            value={form.prix_abonnement}
            min={1000}
            step={1000}
            onChange={(e) =>
              setForm({ ...form, prix_abonnement: Number(e.target.value) })
            }
          />

          <div className="flex items-center gap-3 p-3 bg-surface rounded-md">
            <input
              type="checkbox"
              id="actif"
              checked={form.actif ?? true}
              onChange={(e) => setForm({ ...form, actif: e.target.checked })}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="actif" className="text-sm text-ink cursor-pointer">
              Offre active (visible dans le catalogue client)
            </label>
          </div>
        </form>
      </Modal>

      {/* Confirm Suppression */}
      <ConfirmDialog
        open={!!confirmSuppr}
        onClose={() => setConfirmSuppr(null)}
        onConfirm={handleSupprimer}
        title="Désactiver l'offre"
        message={`Voulez-vous désactiver "${confirmSuppr?.nom}" ? Elle ne sera plus visible par les clients.`}
        confirmLabel="Désactiver"
        variant="danger"
      />
    </AppShell>
  );
}