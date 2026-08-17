import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
  /** Espera antes de avisar del cambio, en milisegundos. */
  delay?: number;
}

/**
 * Buscador con retardo: escribe al momento y avisa cuando dejas de teclear,
 * de modo que una búsqueda de diez letras es una consulta y no diez.
 *
 * El estado se lleva dentro para que el campo no dé tirones mientras la
 * consulta viaja; si el valor de fuera cambia (al limpiar filtros o al volver
 * atrás en el navegador), se resincroniza.
 */
export function SearchField({ value, onChange, label, className, delay = 300 }: SearchFieldProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);

  // Ajuste de estado durante el render, que es lo que recomienda React para
  // resincronizar con una prop: hacerlo en un efecto provoca un render de más
  // y un parpadeo del campo.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => {
      onChange(draft);
    }, delay);
    return () => {
      clearTimeout(timer);
    };
  }, [draft, delay, onChange, value]);

  return (
    <div className={cn('relative', className)}>
      <Search
        size={16}
        aria-hidden
        className="left-3 pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="search"
        value={draft}
        aria-label={label}
        placeholder={label}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        className={cn(
          // 16 px, no 14 (`text-sm`): por debajo, Safari/iOS hace zoom al
          // enfocar el campo y la pantalla salta al escribir (Regla 5).
          'h-10 pr-9 pl-9 text-base w-full rounded-lg border bg-card text-foreground placeholder:text-muted-foreground',
          'transition-[border-color,box-shadow] duration-200 outline-none',
          'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35',
          '[&::-webkit-search-cancel-button]:hidden',
        )}
      />
      {draft && (
        <button
          type="button"
          aria-label={t('common.close')}
          onClick={() => {
            setDraft('');
          }}
          // 36 px y no 32: el objetivo táctil más pequeño de todo el campo,
          // justo donde el pulgar tiene que acertar para borrar y repetir la
          // búsqueda (Regla 5 §4).
          className="right-0.5 h-9 w-9 absolute top-1/2 inline-flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
        >
          <X size={15} aria-hidden />
        </button>
      )}
    </div>
  );
}
