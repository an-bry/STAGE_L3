import { type ReactNode } from 'react';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopbarProps {
  title: string;
  breadcrumb: string[];
  actions?: ReactNode;
}

export default function Topbar({ title, breadcrumb, actions }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-card border-b border-line flex items-center justify-between px-6 sticky top-0 z-20">
      
      {/* GAUCHE : Fil d'Ariane + Titre */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 text-[11px] text-ink-faint mb-0.5">
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {item}
              {i < breadcrumb.length - 1 && <span>›</span>}
            </span>
          ))}
        </div>
        <h1 className="text-lg font-semibold text-ink leading-none">{title}</h1>
      </div>

      {/* DROITE : Actions + Recherche + Notifs + Profil */}
      <div className="flex items-center gap-4">
        
        {/* LE BOUTON D'ACTION SERA AFFICHÉ ICI */}
        {actions && (
          <div className="mr-2">
            {actions}
          </div>
        )}

        {/* Barre de recherche */}
        <div className="hidden md:flex items-center gap-2 bg-surface px-3 py-1.5 rounded-md border border-line w-64">
          <Search size={14} className="text-ink-faint" />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-ink-faint text-ink"
          />
        </div>

        {/* Notifications (ID pour le tuto) */}
        <div id="tour-topbar-notifs" className="relative">
          <button className="p-2 rounded-full hover:bg-surface transition-colors relative">
            <Bell size={18} className="text-ink-soft" />
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-danger rounded-full border-2 border-card"></span>
          </button>
        </div>

        {/* Profil (ID pour le tuto) */}
        <div id="tour-topbar-profile" className="flex items-center gap-3 pl-4 border-l border-line cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-xs">
            {user?.first_name?.[0] || 'U'}{user?.last_name?.[0] || ''}
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-sm font-medium text-ink leading-tight">
              {user?.first_name} {user?.last_name}
            </span>
            <span className="text-[10px] text-ink-faint uppercase tracking-wider">
              {user?.role}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}