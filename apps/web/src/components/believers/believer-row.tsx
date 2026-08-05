import {
  believerName,
  type BelieverListItem,
  type Congregation,
  type MinistryCatalog,
  type IsoDate,
} from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import {
  BelieverActions,
  type BelieverActionHandlers,
} from '@/components/believers/believer-actions';
import { BelieverPhoto } from '@/components/believers/believer-photo';
import { GiftTags } from '@/components/believers/gift-tags';
import { MinistryTags } from '@/components/believers/ministry-tags';
import { Sonda } from '@/components/believers/sonda';
import { StatusBadge } from '@/components/believers/status-badge';
import { TableCell } from '@/components/ui/table';
import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';

export interface BelieverCells extends BelieverActionHandlers {
  believer: BelieverListItem;
  congregation: Congregation | undefined;
  /** El catálogo de labores: la fila guarda slugs, el nombre y el color están aquí. */
  ministries: readonly MinistryCatalog[];
  today: IsoDate;
  canManage: boolean;
  /** Posición en la página: escalona la entrada y el latido de la sonda. */
  index: number;
  /** Marcada para la acción en lote. Solo con `believers.manage`. */
  selected: boolean;
  onToggleSelected: () => void;
}

/**
 * Una fila de la tabla (§7.4).
 *
 * **Foto solo si la hay**, y nunca un círculo con iniciales de color al azar:
 * un avatar inventado compite justo con los dos colores que aquí sí significan
 * algo —el del don y el de la sonda—. Cuando nadie de la página tiene, la
 * columna ni existe y el nombre sostiene la fila él solo (§7.1).
 */
export function BelieverRow({
  believer,
  congregation,
  ministries,
  showPhoto,
  today,
  canManage,
  index,
  selected,
  onToggleSelected,
  ...actions
}: BelieverCells & {
  /**
   * Si la página enseña la columna de fotografía.
   *
   * Lo decide la tabla mirando **toda la página** y no cada fila: una columna
   * que existe para una persona de veinte es una columna vacía que roba ancho.
   * No está en `BelieverCells` porque la ficha de móvil no la necesita —ahí la
   * foto va dentro, no en una columna—.
   */
  showPhoto: boolean;
}) {
  const { t } = useTranslation();
  const name = believerName(believer);

  return (
    <>
      {canManage && (
        <TableCell className="w-0 pr-0">
          <input
            type="checkbox"
            checked={selected}
            aria-label={t('believers.selectOne', { name })}
            onChange={onToggleSelected}
            className="h-4 w-4 rounded cursor-pointer accent-primary focus-visible:ring-2 focus-visible:ring-ring"
          />
        </TableCell>
      )}

      {/* Sin fotografía queda la celda vacía y no un círculo con iniciales: un
          avatar inventado compite con los dos colores que aquí sí significan
          algo, el del don y el de la sonda (§7.1). */}
      {showPhoto && (
        // `w-11` y no `w-px`: el reset pone `max-width: 100%` a las imágenes, y
        // en una celda de un píxel eso deja la foto en cero de ancho y solo se
        // ve el alto. La columna mide lo que mide la foto.
        <TableCell className="w-11 pr-0">
          <BelieverPhoto believer={believer} />
        </TableCell>
      )}

      <TableCell>
        <Link
          to={`/believers/${believer.id}`}
          className="font-medium rounded-sm text-[15px] hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {name}
        </Link>
        {believer.phone && (
          <span className="text-xs block text-muted-foreground tabular-nums">{believer.phone}</span>
        )}
      </TableCell>

      <TableCell>
        {congregation && (
          <span className="gap-2 text-xs inline-flex items-center text-muted-foreground">
            <span
              aria-hidden
              style={accentVars(congregation.accent)}
              className="h-1.5 w-1.5 rounded-full bg-[var(--acento)]"
            />
            {congregation.name}
          </span>
        )}
      </TableCell>

      <TableCell>
        <StatusBadge status={believer.status} />
      </TableCell>

      <TableCell className="lg:table-cell hidden">
        <GiftTags gifts={believer.gifts} max={3} />
      </TableCell>

      {/* Las labores entran más tarde que los dones —`xl` y no `lg`—: son la
          quinta columna de la fila y en un portátil estrecho la aprietan. */}
      <TableCell className="xl:table-cell hidden">
        <MinistryTags slugs={believer.ministries} catalog={ministries} max={2} />
      </TableCell>

      <TableCell>
        <Sonda believer={believer} today={today} index={index} />
      </TableCell>

      <TableCell className={cn('text-right', !canManage && 'w-0 p-0')}>
        <BelieverActions name={name} canManage={canManage} {...actions} />
      </TableCell>
    </>
  );
}
