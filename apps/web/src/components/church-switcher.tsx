import { useSetActiveChurch } from '@navis/api-client';
import { ChevronDown } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChurchBadge } from '@/components/church-badge';
import { ChurchMenu } from '@/components/church-menu';
import { CreateChurchDialog } from '@/components/create-church-dialog';
import { EditChurchDialog } from '@/components/edit-church-dialog';
import { api } from '@/lib/api';
import { useChurches } from '@/lib/churches';
import { cn } from '@/lib/cn';
import { usePermissions } from '@/lib/permissions';
import { toast } from '@/lib/toast';
import { useOutsideClose } from '@/lib/use-outside-close';

/**
 * En qué iglesia se está trabajando, y el paso a otra.
 *
 * Va bajo el logo de la barra lateral, y plegada se queda solo la insignia: es
 * la única pieza de la barra que cambia al cambiar de espacio, así que hace de
 * referencia de dónde está uno (RFC 0008 §8.1).
 *
 * Con una sola iglesia y sin permiso para crear más no es un botón, es una
 * etiqueta: un desplegable con una sola opción es ruido.
 */
export function ChurchSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useTranslation();
  const { items, active } = useChurches();
  const { can } = usePermissions();
  const setActive = useSetActiveChurch(api);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
  }, []);
  useOutsideClose(box, open, close);

  const canCreate = can('churches.manage');

  if (!active) return null;

  const switchTo = (churchId: string) => {
    close();
    if (churchId === active.id) return;

    setActive.mutate(churchId, {
      onSuccess: ({ items: next, activeId }) => {
        const name = next.find((church) => church.id === activeId)?.name ?? '';
        toast.success(t('church.switched', { name }));
      },
      onError: () => {
        toast.error(t('errors.generic'));
      },
    });
  };

  const plate = (
    <span className="min-w-0 gap-2 flex items-center">
      <ChurchBadge id={active.id} name={active.name} />
      {!collapsed && <span className="font-medium truncate">{active.name}</span>}
    </span>
  );

  const shape = cn(
    'gap-2 text-sm flex items-center rounded-lg border bg-background transition-colors',
    collapsed ? 'h-9 w-9 p-0 justify-center' : 'px-2 py-1.5 w-full justify-between',
  );

  return (
    <div ref={box} className="relative">
      {items.length > 1 || canCreate ? (
        <button
          type="button"
          onClick={() => {
            setOpen((current) => !current);
          }}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={t('church.switch')}
          title={collapsed ? active.name : undefined}
          className={cn(shape, 'cursor-pointer hover:bg-muted')}
        >
          {plate}
          {!collapsed && (
            <ChevronDown size={16} aria-hidden className="shrink-0 text-muted-foreground" />
          )}
        </button>
      ) : (
        <div className={shape}>{plate}</div>
      )}

      {open && (
        <ChurchMenu
          items={items}
          activeId={active.id}
          canCreate={canCreate}
          onSelect={switchTo}
          onCreate={() => {
            close();
            setCreating(true);
          }}
          onEdit={() => {
            close();
            setEditing(true);
          }}
        />
      )}

      <EditChurchDialog
        church={active}
        open={editing}
        onClose={() => {
          setEditing(false);
        }}
      />

      <CreateChurchDialog
        open={creating}
        onClose={() => {
          setCreating(false);
        }}
      />
    </div>
  );
}
