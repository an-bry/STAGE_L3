import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, FileText, HardDrive, Shield, Wrench, Calendar,
  Send, Play, RefreshCw,
} from 'lucide-react';
import { alertesApi } from '../../../api/securitrack';
import type { Alertes } from '../../../types/securitrack';
import AppShell from '../../../components/layout/AppShell';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import AccordionAlertes, { LigneAlerte } from '../../../components/securitrack/AccordionAlertes';
import { EtatContratBadge, StatutEquipementBadge, StatutMaintenanceBadge, GarantieBadge } from '../../../components/securitrack/badges';
import { useToast } from '../../../context/ToastContext';

const HORIZONS = [30, 90, 180, 365];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR');
}

export default function AlertesPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [horizon, setHorizon] = useState(30);
  const [data, setData] = useState<Alertes | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal envoi
  const [envoiOpen, setEnvoiOpen] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState<any>(null);

  const charger = (h = horizon) => {
    setLoading(true);
    alertesApi.get(h)
      .then(setData)
      .catch(() => toast.error('Erreur', 'Impossible de charger les alertes.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    charger(horizon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horizon]);

  const handleEnvoyer = async () => {
    setEnvoi(true);
    setResultat(null);
    try {
      const res = await alertesApi.envoyer(horizon, dryRun);
      setResultat(res);
      toast.success(
        dryRun ? 'Simulation terminée' : 'Notifications envoyées',
        dryRun ? 'Aucune notification réelle envoyée.' : 'Les destinataires ont été notifiés.'
      );
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || "Impossible d'envoyer.");
    } finally {
      setEnvoi(false);
    }
  };

  const fermerEnvoi = () => {
    setEnvoiOpen(false);
    setResultat(null);
    setDryRun(true);
  };

  return (
    <AppShell
      title="Alertes"
      breadcrumb={['NjCam', 'SecuriTrack', 'Alertes']}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* Bandeau urgent */}
        {data && data.urgent > 0 && (
          <div className="bg-danger-soft border border-danger/20 rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-danger text-white flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-danger">
                {data.urgent} élément{data.urgent > 1 ? 's' : ''} urgent{data.urgent > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-danger/80 mt-0.5">
                Maintenances en retard + équipements en panne + équipements sans contrat
              </p>
            </div>
          </div>
        )}

        {/* Barre de contrôle */}
        <div className="bg-card border border-line rounded-lg p-4 flex flex-wrap items-center gap-4">
          {/* Horizon */}
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-ink-soft" />
            <span className="text-xs font-medium text-ink-soft">Horizon :</span>
            <div className="flex items-center gap-1 bg-surface rounded-md p-1">
              {HORIZONS.map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    horizon === h
                      ? 'bg-primary text-white'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {h} j
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <button
            onClick={() => charger(horizon)}
            disabled={loading}
            className="p-2 rounded-md text-ink-soft hover:bg-surface hover:text-ink transition-colors disabled:opacity-50"
            title="Rafraîchir"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          <Button
            icon={<Send size={15} />}
            onClick={() => setEnvoiOpen(true)}
            disabled={!data || data.urgent === 0}
          >
            Envoyer les notifications
          </Button>
        </div>

        {/* Chargement / vide */}
        {loading && !data ? (
          <div className="bg-card border border-line rounded-lg p-12 text-center text-sm text-ink-soft">
            Chargement des alertes…
          </div>
        ) : !data ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<AlertTriangle size={24} />}
              title="Aucune donnée"
              description="Impossible de charger les alertes pour le moment."
            />
          </div>
        ) : data.urgent === 0 && Object.values(data.resume).every(v => v === 0) ? (
          <div className="bg-success-soft border border-success/20 rounded-lg p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-success text-white flex items-center justify-center mx-auto mb-3">
              <Shield size={22} />
            </div>
            <p className="text-sm font-semibold text-success">Tout est sous contrôle</p>
            <p className="text-xs text-success/80 mt-1">
              Aucune alerte sur les {horizon} prochains jours.
            </p>
          </div>
        ) : (
          <div className="space-y-3">

            {/* 1. Contrats bientôt expirés */}
            <AccordionAlertes
              title="Contrats bientôt expirés"
              count={data.resume.contrats_bientot_expires}
              tone="warning"
              icon={FileText}
              description="À renouveler avant expiration"
              defaultOpen
            >
              {data.contrats_bientot_expires.map((c) => (
                <LigneAlerte
                  key={c.id}
                  titre={`CTR-${String(c.id).padStart(5, '0')} — ${c.client_nom}`}
                  sousTitre={`${c.equipements_detail.length} équipement${c.equipements_detail.length > 1 ? 's' : ''}`}
                  meta={`Expire le ${formatDate(c.date_fin)}`}
                  badge={<EtatContratBadge etat={c.etat} />}
                  onClick={() => navigate(`/securitrack/admin/contrats/${c.id}`)}
                />
              ))}
            </AccordionAlertes>

            {/* 2. Équipements sans contrat */}
            <AccordionAlertes
              title="Équipements sans contrat"
              count={data.resume.equipements_sans_contrat}
              tone="danger"
              icon={HardDrive}
              description="Installés mais non couverts par un contrat actif"
            >
              {data.equipements_sans_contrat.map((e) => (
                <LigneAlerte
                  key={e.id}
                  titre={`${e.model} — ${e.type_equipement}`}
                  sousTitre={`${e.client_nom} · ${e.site_nom}`}
                  meta={e.adresse_ip ? `IP : ${e.adresse_ip}` : undefined}
                  badge={<StatutEquipementBadge statut={e.statut} />}
                  onClick={() => navigate(`/securitrack/admin/equipements/${e.id}`)}
                />
              ))}
            </AccordionAlertes>

            {/* 3. Garanties qui expirent */}
            <AccordionAlertes
              title="Garanties bientôt expirées"
              count={data.resume.garanties_bientot_expirees}
              tone="warning"
              icon={Shield}
              description="Le constructeur ne couvrira plus l'équipement"
            >
              {data.garanties_bientot_expirees.map((e) => (
                <LigneAlerte
                  key={e.id}
                  titre={`${e.model} — ${e.type_equipement}`}
                  sousTitre={`${e.client_nom} · ${e.site_nom}`}
                  meta={`Fin de garantie : ${formatDate(e.date_fin_garantie)}`}
                  badge={<GarantieBadge jours={e.garantie_jours_restants} expiree={e.garantie_expiree} />}
                  onClick={() => navigate(`/securitrack/admin/equipements/${e.id}`)}
                />
              ))}
            </AccordionAlertes>

            {/* 4. Équipements en panne */}
            <AccordionAlertes
              title="Équipements en panne"
              count={data.resume.equipements_en_panne}
              tone="danger"
              icon={AlertTriangle}
              description="Intervention urgente requise"
            >
              {data.equipements_en_panne.map((e) => (
                <LigneAlerte
                  key={e.id}
                  titre={`${e.model} — ${e.type_equipement}`}
                  sousTitre={`${e.client_nom} · ${e.site_nom}`}
                  meta={e.nb_maintenances > 0 ? `${e.nb_maintenances} maintenance(s) au total` : undefined}
                  badge={<StatutEquipementBadge statut={e.statut} />}
                  onClick={() => navigate(`/securitrack/admin/equipements/${e.id}`)}
                />
              ))}
            </AccordionAlertes>

            {/* 5. Maintenances en retard */}
            <AccordionAlertes
              title="Maintenances en retard"
              count={data.resume.maintenances_en_retard}
              tone="danger"
              icon={Wrench}
              description="Planifiées mais non réalisées à la date prévue"
              defaultOpen={data.resume.maintenances_en_retard > 0}
            >
              {data.maintenances_en_retard.map((m) => (
                <LigneAlerte
                  key={m.id}
                  titre={`${m.equipement_detail.model} — ${m.equipement_detail.type_equipement}`}
                  sousTitre={`${m.site_nom} · ${m.client_nom}`}
                  meta={`Prévue le ${formatDate(m.date)}${m.technicien_nom ? ` · ${m.technicien_nom}` : ''}`}
                  badge={<StatutMaintenanceBadge statut={m.statut} />}
                  onClick={() => navigate(`/securitrack/admin/maintenances`)}
                />
              ))}
            </AccordionAlertes>

            {/* 6. Maintenances à venir */}
            <AccordionAlertes
              title="Maintenances à venir"
              count={data.resume.maintenances_a_venir}
              tone="info"
              icon={Calendar}
              description={`Planifiées dans les ${horizon} prochains jours`}
            >
              {data.maintenances_a_venir.map((m) => (
                <LigneAlerte
                  key={m.id}
                  titre={`${m.equipement_detail.model} — ${m.equipement_detail.type_equipement}`}
                  sousTitre={`${m.site_nom} · ${m.client_nom}`}
                  meta={`${formatDate(m.date)}${m.technicien_nom ? ` · ${m.technicien_nom}` : ''}`}
                  badge={<StatutMaintenanceBadge statut={m.statut} />}
                  onClick={() => navigate(`/securitrack/admin/maintenances`)}
                />
              ))}
            </AccordionAlertes>

          </div>
        )}
      </div>

      {/* Modal envoi */}
      <Modal
        open={envoiOpen}
        onClose={fermerEnvoi}
        title="Envoyer les notifications"
        size="md"
        footer={
          resultat ? (
            <Button onClick={fermerEnvoi}>Fermer</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={fermerEnvoi}>Annuler</Button>
              <Button
                onClick={handleEnvoyer}
                loading={envoi}
                icon={dryRun ? <Play size={15} /> : <Send size={15} />}
              >
                {dryRun ? 'Simuler' : 'Envoyer maintenant'}
              </Button>
            </>
          )
        }
      >
        {!resultat ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">
              Envoie une notification aux personnes concernées pour chaque alerte de
              l'horizon <strong>{horizon} jours</strong>.
            </p>

            {/* Case simuler */}
            <label className="flex items-start gap-3 bg-surface rounded-md p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-line-strong text-primary focus:ring-primary"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">Simuler d'abord</p>
                <p className="text-xs text-ink-soft mt-0.5">
                  Affiche le nombre de notifications qui seraient envoyées, sans rien envoyer.
                </p>
              </div>
            </label>

            {/* Aperçu rapide */}
            {data && (
              <div className="bg-info-soft border border-info/20 rounded-md p-3 text-xs text-info">
                <p className="font-medium mb-1.5">Aperçu ({horizon} j) :</p>
                <ul className="space-y-0.5">
                  <li>• {data.resume.contrats_bientot_expires} contrat(s) bientôt expiré(s)</li>
                  <li>• {data.resume.equipements_sans_contrat} équipement(s) sans contrat</li>
                  <li>• {data.resume.garanties_bientot_expirees} garantie(s) à renouveler</li>
                  <li>• {data.resume.equipements_en_panne} équipement(s) en panne</li>
                  <li>• {data.resume.maintenances_en_retard} maintenance(s) en retard</li>
                  <li>• {data.resume.maintenances_a_venir} maintenance(s) à venir</li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className={`rounded-md p-4 ${dryRun ? 'bg-info-soft border border-info/30' : 'bg-success-soft border border-success/30'}`}>
              <p className={`text-sm font-semibold ${dryRun ? 'text-info' : 'text-success'}`}>
                {dryRun ? 'Simulation terminée' : 'Notifications envoyées'}
              </p>
              <p className={`text-xs mt-0.5 ${dryRun ? 'text-info/80' : 'text-success/80'}`}>
                {dryRun
                  ? 'Aucune notification réelle envoyée.'
                  : 'Les destinataires ont reçu leurs notifications.'}
              </p>
            </div>

            {/* Résultat brut si le back renvoie des compteurs */}
            {typeof resultat === 'object' && (
              <div className="bg-surface rounded-md p-3">
                <p className="text-xs font-medium text-ink-soft mb-2">Détail :</p>
                <pre className="text-[11px] text-ink-soft overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(resultat, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppShell>
  );
}