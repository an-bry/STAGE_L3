import { type SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, className = '', id, children, ...rest },
  ref
) {
  const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-ink mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          {...rest}
          className={`
            w-full h-9 rounded-md border bg-card text-sm text-ink pl-3 pr-9
            appearance-none cursor-pointer
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
            disabled:bg-surface disabled:cursor-not-allowed disabled:text-ink-faint
            ${error ? 'border-danger focus:ring-danger/30 focus:border-danger' : 'border-line'}
            ${className}
          `}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
});

export default Select;