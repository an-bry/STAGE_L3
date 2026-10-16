import { type ReactNode, useState } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';

type Tone = 'danger' | 'warning' | 'info' | 'neutral' | 'success';

const TONES: Record<Tone, { bg: string; text: string; border: string }> = {
  danger: { bg: 'bg-danger-soft', text: 'text-danger', border: 'border-danger/20' },
  warning: { bg: 'bg-warning-soft', text: 'text-warning', border: 'border-warning/20' },
  info: { bg: 'bg-info-soft', text: 'text-info', border: 'border-info/20' },
  success: { bg: 'bg-success-soft', text: 'text-success', border: 'border-success/20' },
  neutral: { bg: 'bg-surface', text: 'text-ink-soft', border: 'border-line' },
};

export default function AccordionAlertes({
  title,
  count,
  tone,
  icon: Icon,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  count: number;
  tone: Tone;
  icon: LucideIcon;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen && count > 0);
  const style = TONES[tone];
  const vide = count === 0;

  return (
    <div className={`bg-card border rounded-lg overflow-hidden transition-colors ${vide ? 'border-line' : style.border}`}>
      {/* Header */}
      <button
        onClick={() => !vide && setOpen((v) => !v)}
        disabled={vide}
        className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${
          vide ? 'opacity-60 cursor-default' : 'hover:bg-surface'
        }`}
      >
        <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
          <Icon size={16} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-ink">{title}</p>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
              {count}
            </span>
          </div>
          {description && (
            <p className="text-xs text-ink-soft mt-0.5 truncate">{description}</p>
          )}
        </div>

        {!vide && (
          <ChevronDown
            size={16}
            className={`text-ink-faint transition-transform shrink-0 ${open ? '' : '-rotate-90'}`}
          />
        )}
      </button>

      {/* Contenu */}
      {open && !vide && (
        <div className="border-t border-line divide-y divide-line">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Ligne réutilisable pour chaque élément d'alerte ──
export function LigneAlerte({
  titre,
  sousTitre,
  meta,
  badge,
  onClick,
}: {
  titre: string;
  sousTitre?: string;
  meta?: string;
  badge?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        onClick ? 'hover:bg-surface' : 'cursor-default'
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">{titre}</p>
        {sousTitre && (
          <p className="text-xs text-ink-soft truncate">{sousTitre}</p>
        )}
        {meta && (
          <p className="text-[11px] text-ink-faint mt-0.5 truncate">{meta}</p>
        )}
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
    </button>
  );
}