import type { ReactNode } from 'react';

/**
 * Una sección de los ajustes: **de qué va a la izquierda, los mandos a la
 * derecha**.
 *
 * El encabezado se queda pegado al desplazarse en pantalla ancha, así que al
 * bajar por un formulario largo nunca se pierde de vista qué se está tocando.
 * Por debajo de `lg` se apila —el rótulo encima de sus mandos— porque en un
 * teléfono dos columnas dejarían el texto en una tira de cinco palabras.
 *
 * El rótulo pequeño en versales es el mismo de la tarjeta de compartir: la
 * aplicación tiene una voz y las pantallas nuevas la heredan, no se inventan
 * otra (Regla 9 §7).
 */
export function SettingsSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="gap-4 lg:grid-cols-[minmax(0,17rem)_1fr] lg:gap-10 grid items-start">
      <div className="lg:sticky lg:top-6 gap-2 flex flex-col">
        <p className="gap-2 font-semibold flex items-center text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          <span aria-hidden className="h-3 w-0.5 rounded-full bg-primary" />
          {eyebrow}
        </p>
        <h2 className="text-lg font-semibold tracking-[-0.01em]">{title}</h2>
        <p className="text-sm text-pretty text-muted-foreground">{description}</p>
      </div>

      <div className="min-w-0">{children}</div>
    </section>
  );
}
