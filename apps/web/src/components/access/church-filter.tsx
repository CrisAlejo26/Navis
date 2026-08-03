import { Check, ChevronDown } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/components/ui/checkbox';
import { useChurches } from '@/lib/churches';
import { cn } from '@/lib/cn';
import { useOutsideClose } from '@/lib/use-outside-close';

/**
 * Por qué iglesias se filtran las cuentas: **varias a la vez** o una sola.
 *
 * No es un `<select>` porque un desplegable nativo múltiple obliga a pulsar con
 * Ctrl y en el teléfono no se maneja; con casillas se ve de un vistazo cuáles
 * están dentro y se marcan de una en una.
 *
 * Solo aparece cuando hay más de una iglesia a la que mirar: con una sola, el
 * filtro no filtra nada y solo ocupa sitio en la barra.
 */
export function ChurchFilter({
  selected,
  onToggle,
  onClear,
  className,
}: {
  selected: readonly string[];
  onToggle: (churchId: string) => void;
  onClear: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const { items } = useChurches();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
  }, []);
  useOutsideClose(box, open, close);

  if (items.length < 2) return null;

  const elegidas = items.filter((church) => selected.includes(church.id));
  const resumen =
    elegidas.length === 0
      ? t('roles.allChurches')
      : (elegidas[0]?.name ?? '') + (elegidas.length > 1 ? ` +${String(elegidas.length - 1)}` : '');

  return (
    <div ref={box} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('roles.filterByChurch')}
        className="h-10 gap-2 px-2.5 text-sm flex w-full cursor-pointer items-center justify-between rounded-lg border bg-card transition-colors hover:bg-muted"
      >
        <span className="truncate">{resumen}</span>
        <ChevronDown size={14} aria-hidden className="shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="right-0 mt-2 w-64 p-2 shadow-lg absolute top-full z-40 rounded-xl border bg-card">
          <button
            type="button"
            onClick={onClear}
            className="gap-2 px-2 py-2 text-sm flex w-full cursor-pointer items-center justify-between rounded-lg transition-colors hover:bg-muted"
          >
            {t('roles.allChurches')}
            {selected.length === 0 && (
              <Check size={16} aria-hidden className="shrink-0 text-primary" />
            )}
          </button>

          <hr className="my-1.5 border-border" />

          <ul className="max-h-64 flex flex-col overflow-y-auto">
            {items.map((church) => (
              <li key={church.id} className="px-2">
                <Checkbox
                  label={church.name}
                  checked={selected.includes(church.id)}
                  onChange={() => {
                    onToggle(church.id);
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
