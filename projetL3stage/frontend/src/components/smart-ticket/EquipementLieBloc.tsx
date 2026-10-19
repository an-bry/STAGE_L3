import { useEffect, useState } from 'react';
import {
  HardDrive,  AlertTriangle, Shield, FileText,
  Link2, Unlink, Loader2,
} from 'lucide-react';
import api from '../../api/axiosConfig';
import Button from '../ui/Button';

import Modal from '../ui/Modal';
import Select from '../ui/Select';
import { useToast } from '../../context/ToastContext';

interface EquipementResume {
  id: number;
  model: string;
  type_equipement: string;
  adresse_ip: string | null;
  statut: string;
}

interface Couverture {
  equipement: number;
  statut_equipement: string;
  sous_contrat: boolean;
  contrat: { id: number; date_fin: string; etat: string } | null;
  sous_garantie: boolean;
  garantie_fin: string;
  garantie_jours_restants: number;
}

interface EquipementDetail {
  id: number;
  model: string;
  type_equipement: string;
  adresse_ip: string | null;
  statut: string;
}

// ⚠️ Endpoints SECURITRACK
const BASE = '/securitrack';

export default function EquipementLieBloc({
  ticketId,
  equipementRef,
  clientId,
  onUpdate,
}: {
  ticketId: number;
  equipementRef: EquipementResume | null | undefined;
  equipementTexteLibre?: string | null;
  clientId: number;
  onUpdate: () => void;
}) {
  const toast = useToast();
  const [couverture, setCouverture] = useState<Couverture | null>(null);
  const [loadingCouv, setLoadingCouv] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [equipementsDispo, setEquipementsDispo] = useState<EquipementDetail[]>([]);
  const [loadingDispo, setLoadingDispo] = useState(false);
  const [equipementChoisi, setEquipementChoisi] = useState<number | ''>('');
  const [marquerPanne, setMarquerPanne] = useState(false);
  const [saving, setSaving] = useState(false);

  // Charge la couverture quand un équipement est lié
  useEffect(() => {
    if (!equipementRef) {
      setCouverture(null);
      return;
    }
    setLoadingCouv(true);
    api.get(`${BASE}/tickets/${ticketId}/couverture/`)
      .then((r) => setCouverture(r.data.couverture))
      .catch(() => setCouverture(null))
      .finally(() => setLoadingCouv(false));
  }, [equipementRef, ticketId]);

  // Charge les équipements du client à l'ouverture de la modale
  useEffect(() => {
    if (!modalOpen) return;
    setLoadingDispo(true);
    api.get(`${BASE}/equipements/`, { params: { client: clientId } })
      .then((r) => setEquipementsDispo(r.data))
      .catch(() => toast.error('Erreur', 'Impossible de charger les équipements.'))
      .finally(() => setLoadingDispo(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, clientId]);

  const handleLier = async () => {
    if (!equipementChoisi) return;
    setSaving(true);
    try {
      await api.patch(`${BASE}/tickets/${ticketId}/equipement/`, {
        equipement: Number(equipementChoisi),
        marquer_en_panne: marquerPanne,
      });
      toast.success('Équipement lié', '');
      setModalOpen(false);
      setEquipementChoisi('');
      setMarquerPanne(false);
      onUpdate();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || 'Impossible de lier.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelier = async () => {
    if (!confirm('Délier cet équipement du ticket ?')) return;
    try {
      await api.patch(`${BASE}/tickets/${ticketId}/equipement/`, { equipement: null });
      toast.success('Équipement délié', '');
      onUpdate();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || 'Impossible de délier.');
    }
  };

  // ── Aucun équipement lié ──
  if (!equipementRef) {
    return (
      <div className="bg-card border border-line rounded-lg p-6">
        <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
          <HardDrive size={16} /> Équipement concerné
        </h3>
        <div className="bg-surface rounded-md p-4 text-center">
          <p className="text-sm text-ink-soft mb-3">
            Aucun équipement n'est lié à ce ticket.
          </p>
          <Button
            variant="secondary"
            icon={<Link2 size={15} />}
            onClick={() => setModalOpen(true)}
          >
            Lier un équipement
          </Button>
        </div>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Lier un équipement"
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleLier}
                loading={saving}
                disabled={!equipementChoisi}
                icon={<Link2 size={15} />}
              >
                Lier
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {loadingDispo ? (
              <div className="flex items-center justify-center py-6 gap-2 text-ink-soft text-sm">
                <Loader2 size={16} className="animate-spin" /> Chargement…
              </div>
            ) : equipementsDispo.length === 0 ? (
              <p className="text-sm text-ink-soft text-center py-6">
                Ce client n'a aucun équipement dans le parc.
              </p>
            ) : (
              <Select
                label="Équipement"
                value={equipementChoisi.toString()}
                onChange={(e) => setEquipementChoisi(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Choisir un équipement…</option>
                {equipementsDispo.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.model} — {eq.type_equipement}
                    {eq.adresse_ip && ` (${eq.adresse_ip})`}
                  </option>
                ))}
              </Select>
            )}

            {equipementChoisi && (
              <label className="flex items-start gap-2 bg-surface rounded-md p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marquerPanne}
                  onChange={(e) => setMarquerPanne(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-line-strong text-danger"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">
                    Marquer l'équipement en panne
                  </p>
                  <p className="text-xs text-ink-soft mt-0.5">
                    L'équipement passera en statut EN_PANNE dans SECURITRACK.
                  </p>
                </div>
              </label>
            )}
          </div>
        </Modal>
      </div>
    );
  }

  // ── Équipement lié ──
  const statutBg =
    equipementRef.statut === 'EN_PANNE'
      ? 'bg-danger-soft text-danger'
      : equipementRef.statut === 'HORS_SERVICE'
      ? 'bg-surface text-ink-soft'
      : 'bg-success-soft text-success';

  const statutLabel =
    equipementRef.statut === 'EN_PANNE'
      ? 'En panne'
      : equipementRef.statut === 'HORS_SERVICE'
      ? 'Hors service'
      : 'Actif';

  return (
    <div className="bg-card border border-line rounded-lg p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
          <HardDrive size={16} /> Équipement concerné
        </h3>
        <button
          onClick={handleDelier}
          className="text-xs text-danger hover:underline flex items-center gap-1"
        >
          <Unlink size={12} /> Délier
        </button>
      </div>

      {/* Carte équipement */}
      <div className="bg-surface border border-line rounded-md p-3 mb-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink">{equipementRef.model}</p>
            <p className="text-xs text-ink-soft">
              {equipementRef.type_equipement}
              {equipementRef.adresse_ip && ` • ${equipementRef.adresse_ip}`}
            </p>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${statutBg}`}>
            {statutLabel}
          </span>
        </div>
      </div>

      {/* Encadré couverture */}
      {loadingCouv ? (
        <div className="text-xs text-ink-soft text-center py-2">
          <Loader2 size={14} className="inline animate-spin" /> Vérification de la couverture…
        </div>
      ) : couverture ? (
        <div className="space-y-2">
          {/* Contrat */}
          <div
            className={`flex items-start gap-2 rounded-md p-2.5 text-xs ${
              couverture.sous_contrat
                ? 'bg-success-soft text-success'
                : 'bg-danger-soft text-danger'
            }`}
          >
            <FileText size={14} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">
                {couverture.sous_contrat ? '✅ Sous contrat' : '❌ Non couvert par un contrat'}
              </p>
              {couverture.sous_contrat && couverture.contrat && (
                <p className="opacity-80 mt-0.5">
                  Contrat #{couverture.contrat.id} · expire le{' '}
                  {new Date(couverture.contrat.date_fin).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          </div>

          {/* Garantie */}
          <div
            className={`flex items-start gap-2 rounded-md p-2.5 text-xs ${
              couverture.sous_garantie
                ? 'bg-success-soft text-success'
                : 'bg-warning-soft text-warning'
            }`}
          >
            <Shield size={14} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">
                {couverture.sous_garantie ? '✅ Sous garantie' : '⚠️ Garantie expirée'}
              </p>
              {couverture.sous_garantie && (
                <p className="opacity-80 mt-0.5">
                  {couverture.garantie_jours_restants} jours restants · fin le{' '}
                  {new Date(couverture.garantie_fin).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-ink-faint italic">
          Couverture indisponible.
        </p>
      )}

      {/* Bouton marquer en panne */}
      {equipementRef.statut === 'ACTIF' && (
        <div className="mt-3 pt-3 border-t border-line">
          <Button
            variant="danger"
            size="sm"
            icon={<AlertTriangle size={13} />}
            onClick={async () => {
              if (!confirm('Marquer cet équipement en panne dans SECURITRACK ?')) return;
              try {
                await api.patch(`${BASE}/tickets/${ticketId}/equipement/`, {
                  equipement: equipementRef.id,
                  marquer_en_panne: true,
                });
                toast.success('Équipement marqué en panne', '');
                onUpdate();
              } catch (err: any) {
                toast.error('Erreur', err?.response?.data?.detail || 'Impossible.');
              }
            }}
          >
            Marquer en panne
          </Button>
        </div>
      )}
    </div>
  );
}
