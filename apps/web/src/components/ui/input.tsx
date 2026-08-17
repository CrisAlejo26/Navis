import type { InputHTMLAttributes, ReactNode, Ref } from 'react';

import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Ayuda permanente bajo el campo. Se esconde cuando hay error. */
  hint?: string;
  error?: string;
  /** Control pegado al borde derecho del campo (ver la contraseña, por ejemplo). */
  trailing?: ReactNode;
  /**
   * Llega hasta el `<input>` de dentro. Hace falta para pedir el foco desde
   * fuera: dentro de un `<dialog>` modal lo reparte el navegador al abrirlo, así
   * que `autoFocus` no vale y hay que pedirlo después.
   *
   * En React 19 `ref` es una prop más de un componente de función; no hace
   * falta `forwardRef`.
   */
  ref?: Ref<HTMLInputElement>;
}

/**
 * El asterisco de obligatorio sale de la propia prop nativa `required`: no
 * hay una prop paralela que haya que recordar poner a la vez. Es
 * `aria-hidden` a propósito —el `required` del `<input>` ya se lo dice al
 * lector de pantalla— y del mismo `text-destructive` en los tres campos de
 * formulario (`Input`, `Textarea`, `Select`), para que sea un solo lenguaje
 * visual y no tres.
 */
export function Input({ label, hint, error, trailing, className, id, ref, ...props }: InputProps) {
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
          {props.required && (
            <span aria-hidden className="ml-0.5 text-destructive">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            // 16 px y no 15: por debajo, Safari/iOS hace zoom automático al
            // enfocar el campo — la pantalla salta y escribir se vuelve
            // incómodo. Es el mismo motivo en `Textarea`, `Select`,
            // `Combobox` y `SearchField` (Regla 5).
            'h-11 px-3.5 text-base w-full rounded-lg border bg-card text-foreground placeholder:text-muted-foreground',
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
