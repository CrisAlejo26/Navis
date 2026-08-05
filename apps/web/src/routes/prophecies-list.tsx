import type { ProphecyListItem } from '@navis/shared';
import { useState } from 'react';

import { DeleteProphecyDialog } from '@/components/prophecies/delete-prophecy-dialog';
import { FulfillmentForm } from '@/components/prophecies/fulfillment-form';
import { PropheciesCards } from '@/components/prophecies/prophecies-cards';
import { PropheciesHeader } from '@/components/prophecies/prophecies-header';
import { PropheciesTable } from '@/components/prophecies/prophecies-table';
import { PropheciesToolbar } from '@/components/prophecies/prophecies-toolbar';
import { PropheciesYear } from '@/components/prophecies/prophecies-year';
import { ProphecyForm } from '@/components/prophecies/prophecy-form';
import type { ProphecyCells } from '@/components/prophecies/prophecy-row';
import { Travesia } from '@/components/prophecies/travesia';
import { usePropheciesScreen } from '@/lib/prophecies/use-prophecies-screen';
import { usePropheciesViewStore } from '@/lib/prophecies/view';

/**
 * El listado de profecías, con sus cuatro formas de verlo (RFC 0004 §7.4).
 *
 * La pregunta que responde no es «¿qué me dijeron?», es **«¿qué ha pasado con
 * lo que me dijeron?»**. De ahí sale todo: la travesía de serie, el filtro por
 * estado y el orden por fecha de recepción.
 */
export function PropheciesListPage() {
  const screen = usePropheciesScreen();
  const view = usePropheciesViewStore((state) => state.view);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ProphecyListItem | null>(null);
  const [fulfilling, setFulfilling] = useState<ProphecyListItem | null>(null);
  const [deleting, setDeleting] = useState<ProphecyListItem | null>(null);

  /** Lo mismo alimenta la fila de la tabla y la ficha (§7.5). */
  const cells = (prophecy: ProphecyListItem, index: number): ProphecyCells => ({
    prophecy,
    index,
    onEdit: () => {
      setEditing(prophecy);
    },
    onFulfill: () => {
      setFulfilling(prophecy);
    },
    onDelete: () => {
      setDeleting(prophecy);
    },
  });

  const toolbar = <PropheciesToolbar screen={screen} />;
  const items = screen.page?.items ?? [];

  return (
    <section className="gap-6 flex flex-col">
      <PropheciesHeader
        stats={screen.stats}
        onAdd={() => {
          setCreating(true);
        }}
      />

      {/* Cambiar de vista es un fundido, sin desplazamiento: no se está yendo a
          otro sitio (§7.8). La clave hace que React remonte y la animación
          vuelva a lanzarse. */}
      <div key={view} className="gap-3 animate-page-in flex flex-col">
        {view === 'table' && <PropheciesTable screen={screen} cells={cells} toolbar={toolbar} />}

        {view === 'cards' && <PropheciesCards screen={screen} cells={cells} toolbar={toolbar} />}

        {/* La travesía y el año necesitan todas las filas de la página juntas,
            así que llevan la barra fuera en vez de dentro de una tarjeta. */}
        {(view === 'travesia' || view === 'year') && (
          <>
            <div className="p-3 rounded-xl border bg-card">{toolbar}</div>
            {view === 'travesia' ? (
              <Travesia items={items} today={screen.today} />
            ) : (
              <PropheciesYear items={items} today={screen.today} />
            )}
          </>
        )}
      </div>

      {/* Al editar viaja el identificador y el formulario carga la palabra
          entera: la fila solo trae un extracto del cuerpo. */}
      {(creating || editing) && (
        <ProphecyForm
          open
          prophecyId={editing?.id}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {fulfilling && (
        <FulfillmentForm
          open
          prophecyId={fulfilling.id}
          onClose={() => {
            setFulfilling(null);
          }}
        />
      )}

      <DeleteProphecyDialog
        prophecy={deleting}
        onClose={() => {
          setDeleting(null);
        }}
      />
    </section>
  );
}
