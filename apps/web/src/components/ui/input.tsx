import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="gap-1.5 flex flex-col">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${String(inputId)}-error` : undefined}
        className={cn(
          'h-10 px-3 text-sm rounded-lg border bg-card text-foreground placeholder:text-muted-foreground',
          'outline-none focus-visible:ring-2 focus-visible:ring-ring',
          error && 'border-destructive',
          className,
        )}
        {...props}
      />
      {error && (
        <p id={`${String(inputId)}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
