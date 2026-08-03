import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/cn';

export interface TabItem<TValue extends string> {
  value: TValue;
  label: string;
  icon?: LucideIcon;
  /** Número que acompaña a la pestaña; por ejemplo, cuántos elementos tiene. */
  count?: number;
}

interface TabsProps<TValue extends string> {
  items: readonly TabItem<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  label: string;
}

/**
 * Pestañas con la marca activa subrayada.
 *
 * Es una `tablist` de verdad: se recorre con las flechas del teclado por el
 * comportamiento nativo de los botones y cada pestaña dice si está activa.
 * Quién guarda el valor —estado local, URL…— lo decide quien la usa.
 */
export function Tabs<TValue extends string>({ items, value, onChange, label }: TabsProps<TValue>) {
  return (
    <div role="tablist" aria-label={label} className="gap-1 flex border-b">
      {items.map((item) => {
        const active = item.value === value;
        const Icon = item.icon;

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              onChange(item.value);
            }}
            className={cn(
              'gap-2 px-4 py-3 text-sm font-medium relative -mb-px inline-flex cursor-pointer items-center',
              'border-b-2 transition-colors duration-200',
              active
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {Icon && <Icon size={16} aria-hidden />}
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[11px] tabular-nums',
                  active ? 'bg-primary/12 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
