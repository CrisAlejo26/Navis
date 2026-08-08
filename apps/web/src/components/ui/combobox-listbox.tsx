import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/cn';
import type { ComboboxOption } from '@/components/ui/combobox';

/**
 * El desplegable de opciones de `Combobox`, aparte porque `Combobox` ya toca
 * el límite de la Regla 6 con el teclado y el `input` (Regla 6 §3: un fichero
 * que mezcla varias cosas se parte).
 */
export function ComboboxListbox({
  id,
  options,
  value,
  activeIndex,
  loading,
  emptyLabel,
  onPick,
}: {
  id: string;
  options: readonly ComboboxOption[];
  value: string;
  activeIndex: number;
  loading: boolean;
  emptyLabel: string;
  onPick: (option: ComboboxOption) => void;
}) {
  return (
    <ul
      id={id}
      role="listbox"
      className="mt-1 py-1 max-h-64 shadow-lg absolute z-20 w-full overflow-y-auto rounded-lg border bg-card"
    >
      {loading && (
        <li className="gap-2 px-3.5 py-2.5 text-sm flex items-center text-muted-foreground">
          <Loader2 size={14} aria-hidden className="animate-spin" />
        </li>
      )}

      {!loading && options.length === 0 && (
        <li className="px-3.5 py-2.5 text-sm text-muted-foreground">{emptyLabel}</li>
      )}

      {!loading &&
        options.map((option, index) => (
          <li
            key={option.value}
            id={`${id}-${String(index)}`}
            role="option"
            aria-selected={option.value === value}
            // `onMouseDown` y no `onClick`: dispara antes que el `blur` del
            // input, que si no cerraría el desplegable antes de elegir.
            onMouseDown={(event) => {
              event.preventDefault();
              onPick(option);
            }}
            className={cn(
              'gap-1 px-3.5 py-2.5 text-sm min-h-11 flex cursor-pointer items-center justify-between',
              index === activeIndex ? 'bg-muted' : 'hover:bg-muted/60',
            )}
          >
            <span>{option.label}</span>
            {option.hint && <span className="text-xs text-muted-foreground">{option.hint}</span>}
          </li>
        ))}
    </ul>
  );
}
