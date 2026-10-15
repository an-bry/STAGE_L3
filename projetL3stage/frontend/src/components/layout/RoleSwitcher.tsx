import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, Check, Shield, User, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Utilisateur } from '../../types/user';

const ROLE_CONFIG: Record<Utilisateur['role'], { label: string; icon: typeof User; path: string }> = {
  CLIENT: { label: 'Client', icon: User, path: '/client/tickets' },
  ADMIN: { label: 'Administrateur', icon: Shield, path: '/admin/tickets' },
  TECHNICIEN: { label: 'Technicien', icon: Wrench, path: '/technicien/tickets' },
};

export default function RoleSwitcher() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;
  const current = ROLE_CONFIG[user.role];

  const switchTo = (role: Utilisateur['role']) => {
    setUser({ ...user, role });
    navigate(ROLE_CONFIG[role].path);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-white/60 hover:bg-white/5 hover:text-white transition-colors"
      >
        <current.icon size={14} />
        <span className="flex-1 text-left truncate">{current.label}</span>
        <ChevronUp size={14} className={`transition-transform ${open ? '' : 'rotate-180'}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white text-ink rounded-md shadow-lg border border-line overflow-hidden animate-slideUp">
          {(Object.keys(ROLE_CONFIG) as Utilisateur['role'][]).map((role) => {
            const { label, icon: Icon } = ROLE_CONFIG[role];
            return (
              <button
                key={role}
                onClick={() => switchTo(role)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface transition-colors"
              >
                <Icon size={14} />
                <span className="flex-1 text-left">{label}</span>
                {role === user.role && <Check size={14} className="text-primary" />}
              </button>
            );
          })}
          <div className="px-3 py-1.5 text-[10px] text-ink-faint border-t border-line bg-surface">
            Mode démo
          </div>
        </div>
      )}
    </div>
  );
}