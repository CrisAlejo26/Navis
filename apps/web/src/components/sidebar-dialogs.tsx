import { CalendarForm } from '@/components/calendar/calendar-form';
import { DeleteCalendarDialog } from '@/components/calendar/delete-calendar-dialog';
import { DeleteListDialog } from '@/components/lists/delete-list-dialog';
import { ListForm } from '@/components/lists/list-form';
import { DeleteTableDialog } from '@/components/tables/delete-table-dialog';
import { TableForm } from '@/components/tables/table-form';
import type { SidebarCrud } from '@/lib/use-sidebar-crud';

/**
 * Los seis diálogos de alta, edición y borrado de un calendario, una lista o
 * una tabla, agrupados aparte para que `AppLayout` se quede en el objetivo
 * de la Regla 6. Los formularios son los mismos que ya usan sus propias
 * fichas: aceptan la fila como prop opcional y renombran en vez de crear
 * (`CalendarForm`, `ListForm`, `TableForm`).
 */
export function SidebarDialogs({ crud }: { crud: SidebarCrud }) {
  const { data, creando, editando, borrando, cerrarFormulario, cerrarBorrado } = crud;

  return (
    <>
      {/* `key`: los tres formularios se quedan montados de fondo mientras la
          barra vive (el `open` solo enseña u oculta el diálogo), así que sin
          una `key` que cambie con el objetivo, el `useState` que arranca de
          `calendar?.name` (o `list?.accent`, `table?.icon`…) solo se evalúa
          una vez —con el primer valor que tuvo, vacío al abrir «Añadir»— y
          cambiar de fila o pasar de crear a editar no lo vuelve a rellenar.
          Con la fila (o «crear») entra un componente nuevo y nace ya bien. */}
      <CalendarForm
        key={editando?.kind === 'calendar' ? editando.id : 'calendar-nuevo'}
        open={creando === 'calendar' || editando?.kind === 'calendar'}
        calendar={
          editando?.kind === 'calendar'
            ? data.calendars.find((one) => one.id === editando.id)
            : undefined
        }
        onClose={cerrarFormulario}
      />

      <ListForm
        key={editando?.kind === 'list' ? editando.id : 'list-nueva'}
        open={creando === 'list' || editando?.kind === 'list'}
        list={
          editando?.kind === 'list' ? data.lists.find((one) => one.id === editando.id) : undefined
        }
        onClose={cerrarFormulario}
      />

      <TableForm
        key={editando?.kind === 'table' ? editando.id : 'tabla-nueva'}
        open={creando === 'table' || editando?.kind === 'table'}
        table={
          editando?.kind === 'table' ? data.tables.find((one) => one.id === editando.id) : undefined
        }
        onClose={cerrarFormulario}
      />

      <DeleteCalendarDialog
        calendar={
          borrando?.kind === 'calendar'
            ? (data.calendars.find((one) => one.id === borrando.id) ?? null)
            : null
        }
        onClose={cerrarBorrado}
      />

      <DeleteListDialog
        list={
          borrando?.kind === 'list'
            ? (data.lists.find((one) => one.id === borrando.id) ?? null)
            : null
        }
        onClose={cerrarBorrado}
      />

      <DeleteTableDialog
        table={
          borrando?.kind === 'table'
            ? (data.tables.find((one) => one.id === borrando.id) ?? null)
            : null
        }
        onClose={cerrarBorrado}
      />
    </>
  );
}
