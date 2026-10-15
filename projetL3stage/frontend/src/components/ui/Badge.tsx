import { type ReactNode } from 'react';

type Variant = 'neutral' | 'primary' | 'warning' | 'danger' | 'success' | 'info';
type Size = 'sm' | 'md';

interface BadgeProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  neutral: 'bg-surface text-ink-soft border border-line',
  primary: 'bg-primary-soft text-primary',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  success: 'bg-success-soft text-success',
  info: 'bg-info-soft text-info',
};

const SIZES: Record<Size, string> = {
  sm: 'px-1.5 py-0.5 text-[11px]',
  md: 'px-2 py-1 text-xs',
};

export default function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded font-medium whitespace-nowrap
        ${VARIANTS[variant]} ${SIZES[size]} ${className}
      `}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}