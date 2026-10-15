import { Check } from 'lucide-react';

export interface Step {
  id: string;
  label: string;
}

interface StepperProps {
  steps: Step[];
  current: number; // index 0-based
  onStepClick?: (index: number) => void;
  className?: string;
}

export default function Stepper({ steps, current, onStepClick, className = '' }: StepperProps) {
  return (
    <ol className={`flex items-center gap-2 ${className}`}>
      {steps.map((step, idx) => {
        const isDone = idx < current;
        const isActive = idx === current;
        const clickable = onStepClick && idx <= current;
        return (
          <li key={step.id} className="flex items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(idx)}
              className={`flex items-center gap-2 min-w-0 ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0
                  transition-colors
                  ${isDone ? 'bg-primary text-white' : ''}
                  ${isActive ? 'bg-primary text-white ring-4 ring-primary-soft' : ''}
                  ${!isDone && !isActive ? 'bg-surface text-ink-soft border border-line' : ''}
                `}
              >
                {isDone ? <Check size={13} /> : idx + 1}
              </span>
              <span
                className={`
                  text-sm font-medium truncate
                  ${isActive ? 'text-ink' : 'text-ink-soft'}
                `}
              >
                {step.label}
              </span>
            </button>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-px ${isDone ? 'bg-primary' : 'bg-line'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}