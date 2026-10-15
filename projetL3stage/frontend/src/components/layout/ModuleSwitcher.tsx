import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Check, Camera, Ticket, Shield } from 'lucide-react';

export type ModuleId = 'camtrack' | 'smart-ticket' | 'securitrack';

interface ModuleConfig {
  id: ModuleId;
  label: string;
  icon: typeof Camera;
  color: string;
  basePath: string;
  actif: boolean;
}

const MODULES: ModuleConfig[] = [
  {
    id: 'camtrack',
    label: 'CamTrack',
    icon: Camera,
    color: 'text-blue-400',
    basePath: '/camtrack',
    actif: true,
  },
  {
    id: 'smart-ticket',
    label: 'Smart Ticket',
    icon: Ticket,
    color: 'text-orange-400',
    basePath: '/smart-ticket',
    actif: true,
  },
  {
    id: 'securitrack',
    label: 'SecuriTrack',
    icon: Shield,
    color: 'text-green-400',
    basePath: '/securitrack',
    actif: false,
  },
];

function detecterModuleActif(pathname: string): ModuleId {
  if (pathname.startsWith('/camtrack')) return 'camtrack';
  if (pathname.startsWith('/smart-ticket')) return 'smart-ticket';
  if (pathname.startsWith('/securitrack')) return 'securitrack';
  return 'smart-ticket'; // défaut
}

export default function ModuleSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const moduleActif = detecterModuleActif(location.pathname);
  const config = MODULES.find((m) => m.id === moduleActif) || MODULES[0];
  const Icon = config.icon;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const switchTo = (mod: ModuleConfig) => {
    if (!mod.actif) return;
    navigate(`${mod.basePath}/client/${mod.id === 'camtrack' ? 'offres' : 'tickets'}`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
      >
        <Icon size={16} className={config.color} />
        <span className="flex-1 text-left text-sm font-medium text-white truncate">
          {config.label}
        </span>
        <ChevronDown
          size={14}
          className={`text-white/40 transition-transform ${open ? '' : '-rotate-90'}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card rounded-md shadow-lg border border-line overflow-hidden z-50 animate-slideUp">
          {MODULES.map((mod) => {
            const ModIcon = mod.icon;
            const isActive = mod.id === moduleActif;
            return (
              <button
                key={mod.id}
                onClick={() => switchTo(mod)}
                disabled={!mod.actif}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-soft text-primary'
                    : mod.actif
                    ? 'text-ink hover:bg-surface'
                    : 'text-ink-faint cursor-not-allowed'
                }`}
              >
                <ModIcon size={14} className={mod.actif ? mod.color : 'text-ink-faint'} />
                <span className="flex-1 text-left">{mod.label}</span>
                {!mod.actif && (
                  <span className="text-[9px] px-1 py-0.5 rounded bg-surface text-ink-faint">
                    BIENTÔT
                  </span>
                )}
                {isActive && <Check size={14} className="text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}