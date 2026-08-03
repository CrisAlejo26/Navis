import type { InputHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Ayuda permanente bajo el campo. Se esconde cuando hay error. */
  hint?: string;
  error?: string;
  /** Control pegado al borde derecho del campo (ver la contraseña, por ejemplo). */
  trailing?: ReactNode;
}

export function Input({ label, hint, error, trailing, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  const describedBy = error
    ? `${String(inputId)}-error`
    : hint
      ? `${String(inputId)}-hint`
      : undefined;

  return (
    <div className="gap-2 flex flex-col">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            'h-11 px-3.5 w-full rounded-lg border bg-card text-[15px] text-foreground placeholder:text-muted-foreground',
            'transition-[border-color,box-shadow] duration-200 outline-none',
            'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35',
            error && 'border-destructive',
            trailing && 'pr-12',
            className,
          )}
          {...props}
        />
        {trailing && <div className="inset-y-0 right-1 absolute flex items-center">{trailing}</div>}
      </div>

      {hint && !error && (
        <p id={`${String(inputId)}-hint`} className="text-xs leading-snug text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${String(inputId)}-error`} className="text-xs leading-snug text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
