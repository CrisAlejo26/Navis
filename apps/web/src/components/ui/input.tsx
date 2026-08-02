import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-foreground text-sm font-medium">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${String(inputId)}-error` : undefined}
        className={cn(
          'bg-card text-foreground placeholder:text-muted-foreground h-10 rounded-lg border px-3 text-sm',
          'focus-visible:ring-ring outline-none focus-visible:ring-2',
          error && 'border-destructive',
          className,
        )}
        {...props}
      />
      {error && (
        <p id={`${String(inputId)}-error`} className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
