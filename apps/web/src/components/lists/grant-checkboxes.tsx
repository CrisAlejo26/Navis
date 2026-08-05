import type { ListSummary } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/components/ui/checkbox';
import { accentVars } from '@/lib/accents';

/**
 * **A qué listas llega este acceso** (RFC 0010 D19).
 *
 * Es la pantalla que ahorra el trabajo: dar a los ancianos las cuatro listas que
 * les tocan es marcar cuatro casillas, no crear cuatro usuarios con cuatro
 * contraseñas. Y quitarles una es desmarcar una: las otras tres siguen igual,
 * sin cambiar ninguna contraseña ni avisar a nadie.
 */
export function GrantCheckboxes({
  lists,
  selected,
  onChange,
  label,
}: {
  lists: readonly ListSummary[];
  selected: readonly string[];
  onChange: (ids: string[]) => void;
  label: string;
}) {
  const { t } = useTranslation();

  if (lists.length === 0) return null;

  return (
    <fieldset className="gap-1 flex flex-col">
      <legend className="mb-1 text-sm font-medium">{label}</legend>

      {lists.map((list) => (
        <div key={list.id} style={accentVars(list.accent)} className="gap-2 flex items-center">
          <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-[var(--acento)]" />
          <Checkbox
            className="order-first"
            checked={selected.includes(list.id)}
            label={`${list.name} · ${t('lists.people', { count: list.memberCount })}`}
            onChange={(event) => {
              onChange(
                event.target.checked
                  ? [...selected, list.id]
                  : selected.filter((one) => one !== list.id),
              );
            }}
          />
        </div>
      ))}
    </fieldset>
  );
}
