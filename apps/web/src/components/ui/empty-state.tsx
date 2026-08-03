import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Lo que se ve cuando no hay nada. No es un hueco: dice qué pasa y, si hay
 * algo que hacer, deja el botón a mano (Regla 9).
 */
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="gap-3 px-6 py-14 flex flex-col items-center text-center">
      <span className="h-11 w-11 inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon size={20} aria-hidden />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {children && <p className="max-w-sm text-sm text-muted-foreground">{children}</p>}
      {action}
    </div>
  );
}
