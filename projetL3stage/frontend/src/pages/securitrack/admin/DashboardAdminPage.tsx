import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Users, FileText, Package, Wrench, Ticket,
  TrendingUp, Loader2,
} from 'lucide-react';
import AppShell from '../../../components/layout/AppShell';
import { dashboardApi } from '../../../api/securitrack';
import type { Dashboard } from '../../../types/securitrack';

// ── Carte KPI cliquable ──
function CarteKPI({
  label, value, hint, tone = 'neutral', icon: Icon, onClick,
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  icon: typeof Users;
  onClick?: () => void;
}) {
  const tones = {
    neutral: 'text-ink-soft bg-surface-2',
    success: 'text-success bg-success-soft',
    warning: 'text-warning bg-warning-soft',
    danger: 'text-danger bg-danger-soft',
    info: 'text-info bg-info-soft',
  };
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`text-left bg-card border border-line rounded-lg p-4 transition-all ${
        onClick ? 'hover:shadow-md hover:border-line-strong cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-ink-soft uppercase tracking-wide">{label}</span>
        <span className={`w-8 h-8 rounded-md flex items-center justify-center ${tones[tone]}`}>
          <Icon size={15} />
        </span>
      </div>
      <p className="text-2xl font-semibold text-ink leading-none">{value}</p>
      {hint && <p className="text-xs text-ink-faint mt-2">{hint}</p>}
    </button>
  );
}

// ── Barre simple pour le graphique 6 mois ──
function Graphique6Mois({ data }: { data: Dashboard['maintenances']['evolution_6_mois'] }) {
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div className="flex items-end gap-3 h-40">
      {data.map((d) => {
        const hTotal = (d.total / max) * 100;
        const hTerm = (d.terminees / max) * 100;
        return (
          <div key={d.mois} className="flex-1 flex flex-col items-center gap-2">
            <div className="flex-1 w-full flex items-end gap-0.5">
              <div className="flex-1 bg-primary-soft rounded-t" style={{ height: `${hTotal}%` }} title={`Total : ${d.total}`}>
                <div className="bg-primary rounded-t w-full" style={{ height: `${(hTerm / Math.max(hTotal, 1)) * 100}%` }} title={`Terminées : ${d.terminees}`} />
              </div>
            </div>
            <span className="text-[10px] text-ink-faint">{d.mois.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardAdminPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardApi.get()
      .then(setData)
      .catch((e) => setError(e?.response?.data?.detail || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppShell title="Tableau de bord" breadcrumb={['SecuriTrack', 'Tableau de bord']}>
        <div className="flex items-center justify-center h-64 text-ink-soft gap-2">
          <Loader2 size={18} className="animate-spin" /> Chargement…
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell title="Tableau de bord" breadcrumb={['SecuriTrack', 'Tableau de bord']}>
        <div className="bg-danger-soft text-danger rounded-lg p-4">{error || 'Aucune donnée'}</div>
      </AppShell>
    );
  }

  const { alertes, utilisateurs, contrats, equipements, maintenances, tickets, camtrack } = data;

  return (
    <AppShell title="Tableau de bord" breadcrumb={['SecuriTrack', 'Tableau de bord']}>
      <div className="p-6 space-y-6">

        {/* Bandeau urgent */}
        {alertes.urgent > 0 && (
          <div className="bg-danger-soft border border-danger/20 rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-danger text-white flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-danger">
                {alertes.urgent} élément{alertes.urgent > 1 ? 's' : ''} demande{alertes.urgent > 1 ? 'nt' : ''} votre attention
              </p>
              <p className="text-xs text-danger/80 mt-0.5">
                {alertes.maintenances_en_retard} maintenance(s) en retard ·{' '}
                {alertes.equipements_en_panne} équipement(s) en panne ·{' '}
                {alertes.equipements_sans_contrat} équipement(s) sans contrat
              </p>
            </div>
            <button
              onClick={() => navigate('/securitrack/admin/alertes')}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-danger text-white hover:bg-danger/90 transition-colors"
            >
              Voir les alertes
            </button>
          </div>
        )}

        {/* Rangée 1 : Utilisateurs / Contrats / Équipements / Maintenances */}
        <div>
          <h2 className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-3">Vue d'ensemble</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CarteKPI
              label="Utilisateurs actifs" icon={Users} tone="info"
              value={utilisateurs.clients + utilisateurs.techniciens + utilisateurs.admins}
              hint={`${utilisateurs.clients} clients · ${utilisateurs.techniciens} tech. · ${utilisateurs.admins} admins`}
              onClick={() => navigate('/securitrack/admin/utilisateurs')}
            />
            <CarteKPI
              label="Contrats actifs" icon={FileText} tone="success"
              value={contrats.actifs}
              hint={`${contrats.bientot_expires} bientôt expirés · ${contrats.expires} expirés`}
              onClick={() => navigate('/securitrack/admin/contrats?etat=ACTIF')}
            />
            <CarteKPI
              label="Équipements" icon={Package} tone="neutral"
              value={equipements.total}
              hint={`${equipements.taux_actifs ?? 0}% actifs · ${equipements.sans_contrat} sans contrat`}
              onClick={() => navigate('/securitrack/admin/equipements')}
            />
            <CarteKPI
              label="Taux de réalisation" icon={Wrench}
              tone={maintenances.en_retard > 0 ? 'warning' : 'success'}
              value={maintenances.taux_realisation !== null ? `${maintenances.taux_realisation}%` : '—'}
              hint={`${maintenances.en_retard} en retard · ${maintenances.ce_mois.total} ce mois`}
              onClick={() => navigate('/securitrack/admin/maintenances')}
            />
          </div>
        </div>

        {/* Rangée 2 : Contrats détail / Équipements détail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-line rounded-lg p-5">
            <h3 className="text-sm font-semibold text-ink mb-4">Contrats</h3>
            <div className="space-y-3">
              <LigneStat label="Actifs" value={contrats.actifs} tone="success" onClick={() => navigate('/securitrack/admin/contrats?etat=ACTIF')} />
              <LigneStat label="Bientôt expirés" value={contrats.bientot_expires} tone="warning" onClick={() => navigate('/securitrack/admin/contrats?etat=BIENTOT_EXPIRE')} />
              <LigneStat label="Expirés" value={contrats.expires} tone="danger" onClick={() => navigate('/securitrack/admin/contrats?etat=EXPIRE')} />
              <LigneStat label="Clients équipés sans contrat" value={contrats.clients_equipes_sans_contrat} tone="warning" onClick={() => navigate('/securitrack/admin/utilisateurs?role=CLIENT')} />
            </div>
          </div>

          <div className="bg-card border border-line rounded-lg p-5">
            <h3 className="text-sm font-semibold text-ink mb-4">Équipements & garanties</h3>
            <div className="space-y-3">
              <LigneStat label="Actifs" value={equipements.par_statut.ACTIF ?? 0} tone="success" onClick={() => navigate('/securitrack/admin/equipements?statut=ACTIF')} />
              <LigneStat label="En panne" value={equipements.par_statut.EN_PANNE ?? 0} tone="danger" onClick={() => navigate('/securitrack/admin/equipements?statut=EN_PANNE')} />
              <LigneStat label="Hors service" value={equipements.par_statut.HORS_SERVICE ?? 0} tone="neutral" onClick={() => navigate('/securitrack/admin/equipements?statut=HORS_SERVICE')} />
              <LigneStat label="Sans contrat" value={equipements.sans_contrat} tone="warning" onClick={() => navigate('/securitrack/admin/equipements?garantie=active')} />
              <LigneStat label="Garanties bientôt expirées" value={equipements.garantie.bientot_expiree} tone="warning" onClick={() => navigate('/securitrack/admin/equipements?garantie=bientot')} />
            </div>
          </div>
        </div>

        {/* Rangée 3 : Graphique + Charge techniciens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-line rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-ink">Maintenances — 6 derniers mois</h3>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary" /> Terminées</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary-soft" /> Total</span>
              </div>
            </div>
            <Graphique6Mois data={maintenances.evolution_6_mois} />
          </div>

          <div className="bg-card border border-line rounded-lg p-5">
            <h3 className="text-sm font-semibold text-ink mb-4">Charge des techniciens (top 5)</h3>
            {maintenances.charge_techniciens.length === 0 ? (
              <p className="text-xs text-ink-faint">Aucune maintenance ouverte.</p>
            ) : (
              <div className="space-y-3">
                {maintenances.charge_techniciens.map((t) => (
                  <div key={t.technicien} className="flex items-center gap-3">
                    <span className="text-xs text-ink flex-1 truncate">{t.nom}</span>
                    <span className="text-xs font-medium text-ink-soft">{t.maintenances_ouvertes}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rangée 4 : Tickets + CAMTRACK */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-line rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Ticket size={15} className="text-ink-soft" />
              <h3 className="text-sm font-semibold text-ink">Tickets (Smart Ticket)</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <MiniStat label="Ouverts" value={tickets.ouverts} />
              <MiniStat label="SLA dépassé" value={tickets.sla_depasse} tone="danger" />
              <MiniStat label="Sans équipement" value={tickets.ouverts_sans_equipement_lie} tone="warning" />
            </div>
            {tickets.equipements_les_plus_en_panne.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-wider mb-2">
                  Équipements les plus touchés
                </p>
                <div className="space-y-1.5">
                  {tickets.equipements_les_plus_en_panne.map((e) => (
                    <button
                      key={e.equipement}
                      onClick={() => navigate(`/securitrack/admin/equipements/${e.equipement}`)}
                      className="w-full flex items-center gap-2 text-xs text-ink hover:bg-surface rounded px-2 py-1 -mx-2 transition-colors"
                    >
                      <span className="flex-1 text-left truncate">{e.model} ({e.type})</span>
                      <span className="text-danger font-medium">{e.nb_tickets}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-card border border-line rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={15} className="text-ink-soft" />
              <h3 className="text-sm font-semibold text-ink">CamTrack — activité</h3>
            </div>
            <div className="space-y-3">
              <LigneStat label="Demandes" value={Object.values(camtrack.demandes).reduce((a, b) => a + b, 0)} tone="neutral" onClick={() => navigate('/camtrack/admin/demandes')} />
              <LigneStat label="Sites" value={Object.values(camtrack.sites).reduce((a, b) => a + b, 0)} tone="neutral" onClick={() => navigate('/securitrack/admin/sites')} />
              <LigneStat label="Installations" value={Object.values(camtrack.installations).reduce((a, b) => a + b, 0)} tone="neutral" onClick={() => navigate('/camtrack/admin/installations')} />
              <LigneStat label="Rapports non validés" value={camtrack.rapports_non_valides} tone={camtrack.rapports_non_valides > 0 ? 'warning' : 'neutral'} onClick={() => navigate('/camtrack/admin/installations')} />
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}

// ── Helpers ──
function LigneStat({ label, value, tone = 'neutral', onClick }: { label: string; value: number; tone?: 'neutral' | 'success' | 'warning' | 'danger'; onClick?: () => void }) {
  const color = { neutral: 'text-ink', success: 'text-success', warning: 'text-warning', danger: 'text-danger' }[tone];
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`w-full flex items-center justify-between text-sm ${onClick ? 'hover:bg-surface rounded px-2 py-1 -mx-2 transition-colors' : ''}`}
    >
      <span className="text-ink-soft">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </button>
  );
}

function MiniStat({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'warning' | 'danger' }) {
  const color = { neutral: 'text-ink', warning: 'text-warning', danger: 'text-danger' }[tone];
  return (
    <div className="text-center">
      <p className={`text-lg font-semibold ${color}`}>{value}</p>
      <p className="text-[10px] text-ink-faint uppercase tracking-wide">{label}</p>
    </div>
  );
}