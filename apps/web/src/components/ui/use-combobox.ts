import { useId, useRef, useState, type KeyboardEvent } from 'react';

import type { ComboboxOption } from '@/components/ui/combobox';

/**
 * El estado y el teclado de `Combobox`, aparte de la vista (Regla 6 §2: un
 * componente con estado se parte en vista + hook).
 */
export function useComboboxState({
  options,
  query,
  onQueryChange,
  onSelect,
}: {
  options: readonly ComboboxOption[];
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (value: string) => void;
}) {
  const id = useId();
  const listId = `${id}-listbox`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const commit = (option: { value: string; label: string }) => {
    onSelect(option.value);
    onQueryChange(option.label);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') setOpen(true);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const chosen = options[activeIndex];
      if (chosen) commit(chosen);
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const onFocus = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const onChange = (next: string) => {
    onQueryChange(next);
    setOpen(true);
    setActiveIndex(-1);
  };

  const onBlur = () => {
    // Un margen para que el `onMouseDown` de una opción llegue antes de que
    // el desplegable se cierre por perder el foco.
    closeTimer.current = setTimeout(() => {
      setOpen(false);
    }, 120);
  };

  return { id, listId, open, activeIndex, commit, onKeyDown, onFocus, onChange, onBlur };
}
