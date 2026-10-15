import { type TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className = '', id, rows = 4, ...rest },
  ref
) {
  const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-ink mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        {...rest}
        className={`
          w-full rounded-md border bg-card text-sm text-ink px-3 py-2
          placeholder:text-ink-faint resize-y
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
          disabled:bg-surface disabled:cursor-not-allowed
          ${error ? 'border-danger focus:ring-danger/30 focus:border-danger' : 'border-line'}
          ${className}
        `}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
});

export default Textarea;