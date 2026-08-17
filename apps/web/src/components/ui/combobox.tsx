import { ChevronDown } from 'lucide-react';

import { ComboboxListbox } from '@/components/ui/combobox-listbox';
import { useComboboxState } from '@/components/ui/use-combobox';
import { cn } from '@/lib/cn';

export interface ComboboxOption {
  value: string;
  label: string;
  /** Texto secundario a la derecha, como el código junto al nombre del país. */
  hint?: string;
}

/**
 * «Escribe y filtra», el patrón que el `Select` nativo de este repositorio no
 * cubre (RFC 0011, ampliación del selector geográfico). `Select` sigue siendo
 * lo correcto para listas cortas y cerradas —labor, sede, don…—, donde abrir
 * el selector del sistema es mejor que cualquier lista que pintemos nosotros;
 * este componente es para cuando la lista no cabe sin buscador (249 países) o
 * no es una lista fija en absoluto (una ciudad se busca, no se recorre).
 *
 * Sigue el patrón de accesibilidad *combobox* del WAI-ARIA: `role="combobox"`
 * en el campo, `role="listbox"` en las opciones, y el filtrado, la petición y
 * el debounce los decide **quien lo usa** — este componente solo pinta lo que
 * se le pasa en `options` (Regla 1: inyectar en vez de importar). El estado y
 * el teclado viven en `useComboboxState` (Regla 6 §2).
 */
export function Combobox({
  name,
  label,
  hint,
  placeholder,
  required,
  disabled,
  value,
  options,
  query,
  onQueryChange,
  onSelect,
  loading = false,
  emptyLabel,
}: {
  name?: string;
  label?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** El valor elegido (el código), o cadena vacía si no hay ninguno. */
  value: string;
  options: readonly ComboboxOption[];
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (value: string) => void;
  loading?: boolean;
  emptyLabel: string;
}) {
  const { id, listId, open, activeIndex, commit, onKeyDown, onFocus, onChange, onBlur } =
    useComboboxState({ options, query, onQueryChange, onSelect });

  const selected = options.find((one) => one.value === value);
  // Mientras se escribe se ve la búsqueda; cerrado, la etiqueta de lo elegido.
  const displayValue = open ? query : (selected?.label ?? query);

  return (
    <div className="gap-2 flex flex-col">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
          {required && (
            <span aria-hidden className="ml-0.5 text-destructive">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${String(activeIndex)}` : undefined}
          autoComplete="off"
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          value={displayValue}
          onFocus={onFocus}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          className={cn(
            // 16 px, no 15: por debajo, Safari/iOS hace zoom al enfocar (ver `Input`).
            'h-11 pr-9 pl-3.5 text-base w-full rounded-lg border bg-card text-foreground placeholder:text-muted-foreground',
            'transition-[border-color,box-shadow] duration-200 outline-none',
            'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35',
          )}
        />
        {name && <input type="hidden" name={name} value={value} />}
        <ChevronDown
          size={16}
          aria-hidden
          className="right-3 pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground"
        />

        {open && (
          <ComboboxListbox
            id={listId}
            options={options}
            value={value}
            activeIndex={activeIndex}
            loading={loading}
            emptyLabel={emptyLabel}
            onPick={commit}
          />
        )}
      </div>

      {hint && <p className="text-xs leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}
