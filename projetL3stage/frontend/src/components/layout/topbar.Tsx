import { Search, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../ui/UserAvatar';
import NotificationBell from './NotificationBell';

interface TopbarProps {
  title: string;
  breadcrumb?: string[];
}

export default function Topbar({ title, breadcrumb }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header className="h-16 shrink-0 bg-card border-b border-line flex items-center gap-4 px-6">
      {/* Titre + breadcrumb */}
      <div className="flex-1 min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1 text-xs text-ink-soft mb-0.5">
            {breadcrumb.map((item, idx) => (
              <span key={idx} className="flex items-center gap-1">
                {idx > 0 && <ChevronRight size={12} className="text-ink-faint" />}
                <span className={idx === breadcrumb.length - 1 ? 'text-ink' : ''}>{item}</span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-base font-semibold text-ink truncate">{title}</h1>
      </div>

      {/* Recherche (démo) */}
      <div className="relative hidden lg:block w-72">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          placeholder="Rechercher…"
          disabled
          title="Recherche globale — bientôt disponible"
          className="w-full h-9 pl-9 pr-3 rounded-md border border-line bg-surface text-sm placeholder:text-ink-faint cursor-not-allowed"
        />
      </div>

      {/* Notifications */}
      <NotificationBell />

      {/* User */}
      {user && (
        <div className="flex items-center gap-2.5 pl-3 border-l border-line">
          <UserAvatar firstName={user.first_name} lastName={user.last_name} size="md" />
          <div className="hidden sm:block min-w-0">
            <p className="text-sm font-medium text-ink truncate leading-tight">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs text-ink-soft leading-tight">{user.role}</p>
          </div>
        </div>
      )}
    </header>
  );
}