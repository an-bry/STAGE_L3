import { type InputHTMLAttributes, forwardRef, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, className = '', id, ...rest },
  ref
) {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          {...rest}
          className={`
            w-full h-9 rounded-md border bg-card text-sm text-ink
            placeholder:text-ink-faint
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
            disabled:bg-surface disabled:cursor-not-allowed disabled:text-ink-faint
            ${icon ? 'pl-9 pr-3' : 'px-3'}
            ${error ? 'border-danger focus:ring-danger/30 focus:border-danger' : 'border-line'}
            ${className}
          `}
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
});

export default Input;