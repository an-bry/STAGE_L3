import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Building2, Camera, FileText,
  Save, CheckCircle2, AlertTriangle, Info,
} from 'lucide-react';
import { getMesEtudes, etudierSite } from '../../../api/camtrackService';
import type { SiteTechnicien, SiteEtudeData } from '../../../types/camtrack';
import AppShell from '../../../components/layout/AppShell';
import Button from '../../../components/ui/Button';
import Textarea from '../../../components/ui/Texterea';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import LocationPicker from '../../../components/ui/LocationPicker';
import Modal from '../../../components/ui/Modal';
import FloatingBar from '../../../components/ui/FloatingBar';
import { useToast } from '../../../context/ToastContext';

export default function EtudeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const siteId = Number(id);

  const [site, setSite] = useState<SiteTechnicien | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [notes, setNotes] = useState('');
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

  const [confirmValider, setConfirmValider] = useState(false);

  const charger = async () => {
    setLoading(true);
    try {
      const sites = await getMesEtudes();
      const found = sites.find((s) => s.id === siteId) || null;
      setSite(found);
      if (found) {
        setNotes(found.notes_faisabilite || '');
        if (found.latitude && found.longitude) {
          setPosition({ lat: found.latitude, lng: found.longitude });
        }
      }
    } catch {
      toast.error('Erreur', 'Impossible de charger le site.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  const sauvegarder = async (valider: boolean) => {
    if (!site) return;

    if (!notes.trim() || notes.trim().length < 10) {
      toast.error('Notes invalides', 'Minimum 10 caractères.');
      return;
    }

    if (valider && !position) {
      toast.error('Position manquante', 'Obtenez la position GPS avant de valider.');
      return;
    }

    setSaving(true);
    try {
      const data: SiteEtudeData = {
        notes_faisabilite: notes.trim(),
        valider,
      };
      if (position) {
        data.latitude = position.lat;
        data.longitude = position.lng;
      }

      const updated = await etudierSite(site.id, data);
      setSite(updated);
      toast.success(
        valider ? 'Site validé !' : 'Brouillon enregistré',
        valider
          ? "L'étude a été validée et le client a été notifié."
          : 'Vous pouvez continuer plus tard.'
      );
      if (valider) {
        setConfirmValider(false);
        navigate('/camtrack/technicien/etudes');
      }
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || "Impossible d'enregistrer.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Étude">
        <div className="p-6 text-ink-soft">Chargement…</div>
      </AppShell>
    );
  }

  if (!site) {
    return (
      <AppShell title="Étude">
        <div className="p-6 max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/camtrack/technicien/etudes')}
            className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink mb-4"
          >
            <ArrowLeft size={16} /> Mes études
          </button>
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<AlertTriangle size={32} />}
              title="Site introuvable"
              action={
                <Button onClick={() => navigate('/camtrack/technicien/etudes')}>
                  Retour
                </Button>
              }
            />
          </div>
        </div>
      </AppShell>
    );
  }

  const lectureSeule = site.statut === 'VALIDE';

  return (
    <AppShell
      title={site.nom}
      breadcrumb={['NjCam', 'CamTrack', 'Mes études', site.nom]}
    >
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <button
          onClick={() => navigate('/camtrack/technicien/etudes')}
          className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={16} /> Mes études
        </button>

        {/* En-tête */}
        <div className="bg-card border border-line rounded-lg p-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2.5 rounded-md bg-primary-soft">
              <MapPin size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge variant={site.statut === 'VALIDE' ? 'success' : 'warning'} dot>
                  {site.statut === 'VALIDE' ? 'Validé' : 'À étudier'}
                </Badge>
                <span className="text-xs text-ink-soft">
                  DEM-{String(site.demande.id).padStart(5, '0')}
                </span>
              </div>
              <h1 className="text-xl font-semibold text-ink">{site.nom}</h1>
              <p className="text-sm text-ink-soft flex items-center gap-1 mt-1">
                <MapPin size={13} /> {site.adresse}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-line grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-ink-soft mb-0.5 flex items-center gap-1">
                <Building2 size={11} /> Client
              </p>
              <p className="text-ink">
                {site.demande.client.first_name} {site.demande.client.last_name}
              </p>
              {site.demande.client.telephone && (
                <p className="text-xs text-ink-soft">{site.demande.client.telephone}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-ink-soft mb-0.5">Offre</p>
              <p className="text-ink">{site.demande.offre.nom}</p>
            </div>
          </div>
        </div>

        {/* Fichiers */}
        {site.fichiers.length > 0 && (
          <div className="bg-card border border-line rounded-lg p-6">
            <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
              <Camera size={16} /> Photos et plans du client ({site.fichiers.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {site.fichiers.map((f) => (
                <a
                  key={f.id}
                  href={f.fichier}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-surface rounded-md p-3 flex flex-col items-center gap-2 hover:border-primary/40 border border-line transition-colors"
                >
                  {f.type_fichier === 'PHOTO' ? (
                    <Camera size={20} className="text-primary" />
                  ) : (
                    <FileText size={20} className="text-primary" />
                  )}
                  <span className="text-xs text-ink-soft truncate max-w-full">
                    {f.fichier.split('/').pop()}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* NOTES */}
        <div className="bg-card border border-line rounded-lg p-6 space-y-4">
          <h3 className="text-base font-semibold text-ink flex items-center gap-2">
            <FileText size={16} /> Notes de faisabilité
          </h3>

          {lectureSeule && (
            <div className="bg-success-soft border border-success/30 rounded-md p-3 flex items-start gap-2 text-xs text-success">
              <Info size={14} className="shrink-0 mt-0.5" />
              <span>Cette étude est validée. Les informations ne sont plus modifiables.</span>
            </div>
          )}

          <Textarea
            label="Observations terrain"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            placeholder="Décrivez vos observations…"
            disabled={lectureSeule}
            hint={`${notes.trim().length} caractères (min 10)`}
          />
        </div>

        {/* CARTE GPS */}
        <div className="bg-card border border-line rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-primary" />
            <h3 className="text-base font-semibold text-ink">Géolocalisation du site</h3>
          </div>

          {lectureSeule && (
            <div className="bg-success-soft border border-success/30 rounded-md p-3 flex items-start gap-2 text-xs text-success">
              <Info size={14} className="shrink-0 mt-0.5" />
              <span>Position enregistrée. Non modifiable.</span>
            </div>
          )}

          <LocationPicker
            position={position}
            onChange={setPosition}
            disabled={lectureSeule}
          />
        </div>
      </div>

      {/* ============================================ */}
      {/* BARRE FLOTTANTE VIA PORTAIL (au-dessus de tout) */}
      {/* ============================================ */}
      {!lectureSeule && (
        <>
          <FloatingBar>
            <div className="text-xs text-ink-soft hidden sm:block">
              {notes.trim().length >= 10 ? (
                <span className="text-success">
                  ✅ Notes OK ({notes.trim().length} car.)
                </span>
              ) : (
                <span className="text-warning">
                  ⚠️ Notes : {notes.trim().length}/10 car.
                </span>
              )}
              {' • '}
              {position ? (
                <span className="text-success">✅ GPS OK</span>
              ) : (
                <span className="text-warning">⚠️ GPS manquant</span>
              )}
            </div>
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="secondary"
                icon={<Save size={15} />}
                loading={saving}
                onClick={() => sauvegarder(false)}
              >
                Enregistrer le brouillon
              </Button>
              <Button
                type="button"
                variant="success"
                icon={<CheckCircle2 size={15} />}
                onClick={() => setConfirmValider(true)}
                disabled={notes.trim().length < 10 || !position}
              >
                Valider l'étude
              </Button>
            </div>
          </FloatingBar>
          {/* Espace pour ne pas cacher le contenu sous la barre */}
          <div className="h-24" />
        </>
      )}

      {/* Modale de confirmation */}
      <Modal
        open={confirmValider}
        onClose={() => setConfirmValider(false)}
        title="Valider l'étude"
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmValider(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="success"
              icon={<CheckCircle2 size={15} />}
              onClick={() => sauvegarder(true)}
              loading={saving}
            >
              Valider définitivement
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">
            En validant cette étude, vous confirmez que le site est prêt pour
            l'installation. Le client sera notifié et les informations ne seront plus
            modifiables.
          </p>
          <div className="bg-warning-soft border border-warning/30 rounded-md p-3 flex items-start gap-2 text-xs text-warning">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>Cette action est irréversible.</span>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}