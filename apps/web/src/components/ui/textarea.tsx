import type { Ref, TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  /** Ayuda permanente bajo el campo. */
  hint?: string;
  /** Llega hasta el `<textarea>`: hace falta para pedirle el foco desde fuera. */
  ref?: Ref<HTMLTextAreaElement>;
}

/**
 * Campo de texto largo, con su etiqueta.
 *
 * Vive en `ui` porque lo usan las notas de creyentes y las profecías, y tenerlo
 * como una cadena de clases copiada en cada formulario era lo que había antes
 * (Regla 1 §5). `resize-y` a propósito: quien escribe mucho lo agranda, y a lo
 * ancho no, que rompería el ancho de lectura.
 */
export function Textarea({ label, hint, className, id, ref, ...props }: TextareaProps) {
  const fieldId = id ?? props.name;

  return (
    <label htmlFor={fieldId} className="gap-2 flex flex-col">
      {label && <span className="text-sm font-medium text-foreground">{label}</span>}

      <textarea
        ref={ref}
        id={fieldId}
        className={cn(
          'px-3.5 py-3 leading-relaxed w-full resize-y rounded-lg border bg-card text-[15px]',
          'text-foreground outline-none placeholder:text-muted-foreground',
          'transition-[border-color,box-shadow] duration-200',
          'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35',
          className,
        )}
        {...props}
      />

      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
