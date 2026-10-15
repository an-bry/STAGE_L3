import { type ReactNode } from 'react';

export interface TimelineItem {
  id: string | number;
  title: string;
  description?: string;
  date?: string;
  icon?: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const DOT_COLORS = {
  default: 'bg-ink-faint',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export default function Timeline({ items, className = '' }: TimelineProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-ink-soft text-center py-6">
        Aucun événement enregistré.
      </p>
    );
  }

  return (
    <ol className={`relative space-y-5 ${className}`}>
      {items.map((item, idx) => (
        <li key={item.id} className="relative flex gap-3">
          <div className="flex flex-col items-center shrink-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-white ${DOT_COLORS[item.variant || 'default']}`}
            >
              {item.icon || <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            {idx < items.length - 1 && <div className="flex-1 w-px bg-line mt-1" />}
          </div>
          <div className="flex-1 pb-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-ink">{item.title}</p>
              {item.date && (
                <span className="text-xs text-ink-soft shrink-0">{item.date}</span>
              )}
            </div>
            {item.description && (
              <p className="text-sm text-ink-soft mt-0.5">{item.description}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}