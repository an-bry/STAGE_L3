import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; label?: string };
  accent?: 'primary' | 'warning' | 'danger' | 'success' | 'info';
  className?: string;
}

const ACCENTS = {
  primary: 'text-primary bg-primary-soft',
  warning: 'text-warning bg-warning-soft',
  danger: 'text-danger bg-danger-soft',
  success: 'text-success bg-success-soft',
  info: 'text-info bg-info-soft',
};

export default function KpiCard({
  label,
  value,
  icon,
  trend,
  accent = 'primary',
  className = '',
}: KpiCardProps) {
  return (
    <div className={`bg-card border border-line rounded-lg p-4 shadow-xs ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-soft uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-semibold text-ink mt-1.5">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-1.5">
              {trend.value >= 0 ? (
                <TrendingUp size={13} className="text-success" />
              ) : (
                <TrendingDown size={13} className="text-danger" />
              )}
              <span className={`text-xs font-medium ${trend.value >= 0 ? 'text-success' : 'text-danger'}`}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              {trend.label && <span className="text-xs text-ink-soft ml-1">{trend.label}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-2 rounded-md shrink-0 ${ACCENTS[accent]}`}>{icon}</div>
        )}
      </div>
    </div>
  );
}