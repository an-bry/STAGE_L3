import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Ticket, Wrench, LogOut, LayoutDashboard, BarChart3, Users,
  Camera, FileText, ClipboardList, Package,
  MapPin, Shield,
  HardDrive,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import RoleSwitcher from './RoleSwitcher';
import ModuleSwitcher, { type ModuleId } from './ModuleSwitcher';
import type { Utilisateur } from '../../types/user';

interface NavItem {
  label: string;
  path: string;
  icon: typeof Ticket;
  demo?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

// ============================================
// NAVIGATION PAR MODULE ET PAR RÔLE
// ============================================
const NAV_CAMTRACK: Record<Utilisateur['role'], NavSection[]> = {
  CLIENT: [
  {
    items: [
      { label: 'Catalogue', path: '/camtrack/client/offres', icon: Camera },
      { label: 'Mes demandes', path: '/camtrack/client/demandes', icon: FileText },
      { label: 'Mes installations', path: '/camtrack/client/installations', icon: HardDrive },
    ],
  },
],
  ADMIN: [
    {
      title: 'Gestion',
      items: [
        { label: 'Demandes', path: '/camtrack/admin/demandes', icon: ClipboardList },
        { label: 'Offres', path: '/camtrack/admin/offres', icon: Package },
        { label: 'Installations', path: '/camtrack/admin/installations', icon: Camera },
        { label: 'Garanties', path: '/camtrack/admin/garanties', icon: Shield },
      ],
    },
  ],
  TECHNICIEN: [
    {
      title: 'Mes missions',
      items: [
        { label: 'Études de site', path: '/camtrack/technicien/etudes', icon: MapPin },
        { label: 'Installations', path: '/camtrack/technicien/installations', icon: Camera },
      ],
    },
  ],
};

const NAV_SMART_TICKET: Record<Utilisateur['role'], NavSection[]> = {
  CLIENT: [
    {
      items: [{ label: 'Mes tickets', path: '/smart-ticket/client/tickets', icon: Ticket }],
    },
  ],
  ADMIN: [
    {
      title: 'Gestion',
      items: [
        { label: 'Tickets', path: '/smart-ticket/admin/tickets', icon: Ticket },
        { label: 'Priorisation', path: '/smart-ticket/admin/priorisation', icon: BarChart3 },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { label: 'Équipe', path: '/smart-ticket/admin/equipe', icon: Users },
      ],
    },
  ],
  TECHNICIEN: [
    {
      items: [{ label: 'Mes interventions', path: '/smart-ticket/technicien/tickets', icon: Wrench }],
    },
  ],
};

const NAV_SECURITRACK: Record<Utilisateur['role'], NavSection[]> = {
  CLIENT: [],
  ADMIN: [],
  TECHNICIEN: [],
};

const ROLE_LABELS: Record<Utilisateur['role'], string> = {
  CLIENT: 'Client',
  ADMIN: 'Administrateur',
  TECHNICIEN: 'Technicien',
};

function detecterModule(pathname: string): ModuleId {
  if (pathname.startsWith('/camtrack')) return 'camtrack';
  if (pathname.startsWith('/smart-ticket')) return 'smart-ticket';
  if (pathname.startsWith('/securitrack')) return 'securitrack';
  return 'smart-ticket';
}

function getNav(module: ModuleId, role: Utilisateur['role']): NavSection[] {
  switch (module) {
    case 'camtrack':
      return NAV_CAMTRACK[role];
    case 'smart-ticket':
      return NAV_SMART_TICKET[role];
    case 'securitrack':
      return NAV_SECURITRACK[role];
  }
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const module = detecterModule(location.pathname);
  const sections = getNav(module, user.role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex w-64 shrink-0 bg-ink text-white flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0">
          <LayoutDashboard size={16} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold tracking-tight leading-tight">NjCam</p>
          <p className="text-[10px] text-white/40 leading-tight">PRO</p>
        </div>
      </div>

      {/* Sélecteur de module */}
      <div className="px-3 py-3 border-b border-white/10">
        <ModuleSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {sections.map((section, idx) => (
          <div key={idx}>
            {section.title && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ label, path, icon: Icon, demo }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Icon size={16} />
                  <span className="flex-1 truncate">{label}</span>
                  {demo && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-warning/20 text-warning font-medium">
                      DÉMO
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/10 space-y-1">
        <RoleSwitcher />
        <div className="px-3 py-2">
          <p className="text-sm font-medium truncate text-white">
            {user.first_name} {user.last_name}
          </p>
          <p className="text-xs text-white/40">{ROLE_LABELS[user.role]}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut size={16} /> Déconnexion
        </button>
      </div>
    </aside>
  );
}