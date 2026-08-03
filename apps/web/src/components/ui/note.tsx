import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

type Variant = 'info' | 'warning';

const variants: Record<Variant, { box: string; icon: string }> = {
  info: { box: 'border-border bg-muted/60', icon: 'text-primary' },
  warning: { box: 'border-warning/40 bg-warning/10', icon: 'text-warning' },
};

interface NoteProps {
  icon: LucideIcon;
  title: string;
  variant?: Variant;
  children?: ReactNode;
}

/** Aviso corto con icono: explica algo del contexto sin gritar. */
export function Note({ icon: Icon, title, variant = 'info', children }: NoteProps) {
  const style = variants[variant];

  return (
    <div className={cn('gap-3 p-3.5 flex items-start rounded-lg border', style.box)}>
      <Icon size={18} aria-hidden className={cn('mt-0.5 shrink-0', style.icon)} />
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {children && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{children}</p>
        )}
      </div>
    </div>
  );
}
