import { Sparkles } from 'lucide-react';

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-warning-soft text-warning border border-warning/20">
      <Sparkles size={11} />
      Démo
    </span>
  );
}

interface DemoBannerProps {
  message?: string;
}

export function DemoBanner({
  message = "Cette vue est une maquette. Le branchement backend est prévu.",
}: DemoBannerProps) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-warning-soft border border-warning/20 text-warning text-xs">
      <Sparkles size={14} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}