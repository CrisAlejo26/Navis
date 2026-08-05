import type { Congregation, ListSummary } from '@navis/shared';
import { Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { BulkCongregationAction } from '@/components/believers/bulk-congregation-action';
import { BulkListAction } from '@/components/believers/bulk-list-action';
import { Button } from '@/components/ui/button';

/**
 * La barra que aparece al marcar personas en el listado (RFC 0003 §7.4).
 *
 * Existe por una razón concreta: quien se da de alta desde el selector de
 * predicadores del calendario nace **sin sede** —allí no se pregunta—, y
 * ponérsela a treinta hermanos abriendo treinta fichas es la clase de fricción
 * que acaba en «ya lo haré».
 *
 * Sus **tres** acciones no borran nada: poner sede, añadir a una lista (RFC
 * 0010 §8.7) y llevarse las filas marcadas a un fichero (RFC 0009 D1). Borrar a
 * veinte personas de un clic seguirá sin estar aquí: no es una comodidad, es un
 * accidente esperando.
 */
export function BulkBar({
  selected,
  congregations,
  lists,
  canManage,
  canManageLists,
  onExport,
  onDone,
  onClear,
}: {
  selected: readonly string[];
  congregations: readonly Congregation[];
  lists: readonly ListSummary[];
  /** Poner sede cambia fichas; exportar, no. Solo la primera pide permiso. */
  canManage: boolean;
  /** Meter a alguien en una lista es otro permiso: es de listas, no de fichas. */
  canManageLists: boolean;
  onExport: () => void;
  onDone: () => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  if (selected.length === 0) return null;

  return (
    <div className="gap-3 p-3 sm:flex-row sm:items-center flex flex-col rounded-xl border border-primary/30 bg-primary/5">
      <p className="text-sm font-medium tabular-nums">
        {t('believers.selected', { count: selected.length })}
      </p>

      <div className="gap-2 sm:ml-auto flex flex-wrap items-center">
        <Button variant="secondary" size="sm" onClick={onExport}>
          <Download size={14} aria-hidden />
          {t('export.selectedAction', { count: selected.length })}
        </Button>

        {canManage && (
          <BulkCongregationAction
            selected={selected}
            congregations={congregations}
            onDone={onDone}
          />
        )}

        {canManageLists && <BulkListAction selected={selected} lists={lists} onDone={onDone} />}

        <Button
          variant="ghost"
          size="icon"
          aria-label={t('believers.clearSelection')}
          onClick={onClear}
        >
          <X size={15} aria-hidden />
        </Button>
      </div>
    </div>
  );
}
