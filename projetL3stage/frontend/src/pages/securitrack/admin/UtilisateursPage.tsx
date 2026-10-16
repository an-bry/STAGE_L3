import { useEffect, useMemo, useState } from 'react';
import {
  Users, Search, Plus, Shield, User, Wrench, Pencil, KeyRound,
  Power, Trash2, CheckCircle2, XCircle,
} from 'lucide-react';
import { utilisateursApi } from '../../../api/securitrack';
import type {  Utilisateur } from '../../../types/securitrack';
import AppShell from '../../../components/layout/AppShell';
import Input from '../../../components/ui/input';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import UtilisateurFormModal from '../../../components/securitrack/UtilisateurFormModal';
import ResetMotDePasseModal from '../../../components/securitrack/ResetMotDePasseModal';
import UtilisateurSuppressionModal from '../../../components/securitrack/UtilisateurSuppressionModal';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

type TabId = 'tous' | 'clients' | 'techniciens' | 'admins' | 'inactifs';

// ── Config par rôle : blindée contre les variations ──
const ROLE_BADGE: Record<string, { label: string; tone: string; icon: typeof User }> = {
  ADMIN: { label: 'Admin', tone: 'bg-primary-soft text-primary', icon: Shield },
  TECHNICIEN: { label: 'Technicien', tone: 'bg-warning-soft text-warning', icon: Wrench },
  CLIENT: { label: 'Client', tone: 'bg-info-soft text-info', icon: User },
};

const ROLE_FALLBACK = {
  label: 'Inconnu',
  tone: 'bg-surface text-ink-soft',
  icon: User,
};

function RoleBadge({ role }: { role: string | null | undefined }) {
  // Normalise : "client" → "CLIENT", gère null/undefined
  const key = String(role || '').toUpperCase().trim();
  const config = ROLE_BADGE[key] ?? ROLE_FALLBACK;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${config.tone}`}>
      <Icon size={11} /> {config.label}
    </span>
  );
}
function initials(u: Utilisateur) {
  return ((u.first_name?.[0] || u.username[0]) + (u.last_name?.[0] || '')).toUpperCase();
}

function nomComplet(u: Utilisateur) {
  const n = `${u.first_name} ${u.last_name}`.trim();
  return n || u.username;
}

export default function UtilisateursPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('tous');

  // Modales
  const [formOpen, setFormOpen] = useState(false);
  const [userEdit, setUserEdit] = useState<Utilisateur | null>(null);

  const [resetUser, setResetUser] = useState<Utilisateur | null>(null);
  const [suppressionUser, setSuppressionUser] = useState<Utilisateur | null>(null);
  const [toggleUser, setToggleUser] = useState<Utilisateur | null>(null);
  const [toggling, setToggling] = useState(false);

  const charger = () => {
    setLoading(true);
    utilisateursApi.list()
      .then(setUtilisateurs)
      .catch(() => toast.error('Erreur', 'Impossible de charger les utilisateurs.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stats
  const stats = useMemo(() => ({
    total: utilisateurs.length,
    clients: utilisateurs.filter(u => u.role === 'CLIENT').length,
    techniciens: utilisateurs.filter(u => u.role === 'TECHNICIEN').length,
    admins: utilisateurs.filter(u => u.role === 'ADMIN').length,
    inactifs: utilisateurs.filter(u => !u.is_active).length,
  }), [utilisateurs]);

  // Filtre onglet + recherche + tri
  const affiches = useMemo(() => {
    let liste = [...utilisateurs].sort((a, b) => a.id - b.id);

    if (activeTab === 'clients') liste = liste.filter(u => u.role === 'CLIENT');
    else if (activeTab === 'techniciens') liste = liste.filter(u => u.role === 'TECHNICIEN');
    else if (activeTab === 'admins') liste = liste.filter(u => u.role === 'ADMIN');
    else if (activeTab === 'inactifs') liste = liste.filter(u => !u.is_active);

    if (recherche.trim()) {
      const q = recherche.toLowerCase();
      liste = liste.filter(u =>
        u.username.toLowerCase().includes(q) ||
        u.first_name.toLowerCase().includes(q) ||
        u.last_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.raison_sociale && u.raison_sociale.toLowerCase().includes(q))
      );
    }
    return liste;
  }, [utilisateurs, activeTab, recherche]);

  const handleToggleActif = async () => {
    if (!toggleUser) return;
    setToggling(true);
    try {
      await utilisateursApi.update(toggleUser.id, { is_active: !toggleUser.is_active });
      toast.success(
        toggleUser.is_active ? 'Utilisateur désactivé' : 'Utilisateur réactivé',
        ''
      );
      setToggleUser(null);
      charger();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.detail || 'Impossible.');
    } finally {
      setToggling(false);
    }
  };

  const isSoiMeme = (u: Utilisateur) => currentUser?.id === u.id;

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'tous', label: 'Tous', count: stats.total },
    { id: 'clients', label: 'Clients', count: stats.clients },
    { id: 'techniciens', label: 'Techniciens', count: stats.techniciens },
    { id: 'admins', label: 'Admins', count: stats.admins },
    { id: 'inactifs', label: 'Désactivés', count: stats.inactifs },
  ];

  return (
    <AppShell
      title="Utilisateurs"
      breadcrumb={['NjCam', 'SecuriTrack', 'Utilisateurs']}
    >
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-info-soft text-info"><User size={18} /></div>
            <div>
              <p className="text-xs text-ink-soft">Clients</p>
              <p className="text-xl font-semibold text-ink">{stats.clients}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-warning-soft text-warning"><Wrench size={18} /></div>
            <div>
              <p className="text-xs text-ink-soft">Techniciens</p>
              <p className="text-xl font-semibold text-ink">{stats.techniciens}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary-soft text-primary"><Shield size={18} /></div>
            <div>
              <p className="text-xs text-ink-soft">Admins</p>
              <p className="text-xl font-semibold text-ink">{stats.admins}</p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-surface text-ink-soft"><XCircle size={18} /></div>
            <div>
              <p className="text-xs text-ink-soft">Désactivés</p>
              <p className="text-xl font-semibold text-ink">{stats.inactifs}</p>
            </div>
          </div>
        </div>

        {/* Onglets + bouton */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="border-b border-line flex-1 min-w-0">
            <div className="flex items-center gap-1 -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-ink-soft hover:text-ink'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-ink-soft">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <Button icon={<Plus size={15} />} onClick={() => { setUserEdit(null); setFormOpen(true); }}>
            Nouvel utilisateur
          </Button>
        </div>

        {/* Recherche */}
        {utilisateurs.length > 0 && (
          <Input
            placeholder="Rechercher par nom, email ou raison sociale…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            icon={<Search size={15} />}
          />
        )}

        {/* Liste */}
        {loading ? (
          <div className="bg-card border border-line rounded-lg p-12 text-center text-sm text-ink-soft">
            Chargement des utilisateurs…
          </div>
        ) : utilisateurs.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Users size={24} />}
              title="Aucun utilisateur"
              description="Créez le premier compte utilisateur."
              action={<Button icon={<Plus size={15} />} onClick={() => setFormOpen(true)}>Créer</Button>}
            />
          </div>
        ) : affiches.length === 0 ? (
          <div className="bg-card border border-line rounded-lg">
            <EmptyState
              icon={<Search size={24} />}
              title="Aucun résultat"
              description={`Rien pour "${recherche || activeTab}".`}
            />
          </div>
        ) : (
          <div className="space-y-2">
            {affiches.map((u) => {
              const soi = isSoiMeme(u);
              return (
                <div
                  key={u.id}
                  className={`bg-card border rounded-lg p-4 transition-all ${
                    !u.is_active ? 'border-line opacity-60' : 'border-line hover:border-primary/40 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                        {initials(u)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-medium text-ink">
                            {nomComplet(u)}
                          </p>
                          {soi && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-white font-medium">
                              VOUS
                            </span>
                          )}
                          {!u.is_active && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-ink-soft font-medium">
                              DÉSACTIVÉ
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-soft truncate">@{u.username} · {u.email}</p>
                        {u.raison_sociale && (
                          <p className="text-xs text-ink-soft mt-0.5 truncate">{u.raison_sociale}</p>
                        )}
                        {u.telephone && (
                          <p className="text-xs text-ink-faint mt-0.5">📞 {u.telephone}</p>
                        )}
                      </div>

                      {/* Badge rôle */}
                      <div className="shrink-0">
                        <RoleBadge role={u.role} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setUserEdit(u); setFormOpen(true); }}
                        className="p-2 rounded text-ink-soft hover:bg-surface hover:text-primary transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setResetUser(u)}
                        className="p-2 rounded text-ink-soft hover:bg-surface hover:text-warning transition-colors"
                        title="Réinitialiser le mot de passe"
                      >
                        <KeyRound size={14} />
                      </button>
                      <button
                        onClick={() => !soi && setToggleUser(u)}
                        disabled={soi}
                        className="p-2 rounded text-ink-soft hover:bg-surface hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={u.is_active ? 'Désactiver' : 'Réactiver'}
                      >
                        {u.is_active ? <Power size={14} /> : <CheckCircle2 size={14} />}
                      </button>
                      <button
                        onClick={() => !soi && setSuppressionUser(u)}
                        disabled={soi}
                        className="p-2 rounded text-ink-soft hover:bg-danger-soft hover:text-danger transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modales */}
      <UtilisateurFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setUserEdit(null); }}
        onSuccess={charger}
        utilisateur={userEdit}
      />

      <ResetMotDePasseModal
        open={!!resetUser}
        onClose={() => setResetUser(null)}
        utilisateur={resetUser}
      />

      <UtilisateurSuppressionModal
        open={!!suppressionUser}
        onClose={() => setSuppressionUser(null)}
        onSuccess={charger}
        utilisateur={suppressionUser}
      />

      {/* Modal toggle actif */}
      <Modal
        open={!!toggleUser}
        onClose={() => setToggleUser(null)}
        title={toggleUser?.is_active ? 'Désactiver l\'utilisateur' : 'Réactiver l\'utilisateur'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToggleUser(null)}>Annuler</Button>
            <Button
              variant={toggleUser?.is_active ? 'danger' : 'primary'}
              onClick={handleToggleActif}
              loading={toggling}
            >
              {toggleUser?.is_active ? 'Désactiver' : 'Réactiver'}
            </Button>
          </>
        }
      >
        {toggleUser && (
          <p className="text-sm text-ink-soft">
            {toggleUser.is_active ? (
              <>
                <strong>{nomComplet(toggleUser)}</strong> ne pourra plus se connecter.
                Ses données restent intactes.
              </>
            ) : (
              <>
                <strong>{nomComplet(toggleUser)}</strong> pourra à nouveau se connecter.
              </>
            )}
          </p>
        )}
      </Modal>
    </AppShell>
  );
}