import { useDreamsStats } from '@navis/api-client';
import type { DreamListItem } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteDreamDialog } from '@/components/dreams/delete-dream-dialog';
import { DreamForm } from '@/components/dreams/dream-form';
import { DreamsHeader } from '@/components/dreams/dreams-header';
import { DreamsTable } from '@/components/dreams/dreams-table';
import { DreamsToolbar } from '@/components/dreams/dreams-toolbar';
import type { DreamCells } from '@/components/dreams/dream-row';
import { BackLink } from '@/components/ui/back-link';
import { DateRangeButton } from '@/components/ui/date-range-button';
import { api } from '@/lib/api';
import { useDreamsScreen } from '@/lib/dreams/use-dreams-screen';

/**
 * El listado de sueños (RFC 0005 §7.5).
 *
 * La pregunta que responde es **«¿qué soñé, y cuándo?»**: de ahí sale que la
 * noche vaya primero y en grande, que el orden por defecto sea por noche hacia
 * atrás y que el color de la lista lo pongan las emociones.
 */
export function DreamsListPage() {
  const { t } = useTranslation();
  const screen = useDreamsScreen();
  const { data: stats } = useDreamsStats(api);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<DreamListItem | null>(null);
  const [deleting, setDeleting] = useState<DreamListItem | null>(null);

  /** Lo mismo alimenta la fila de la tabla y la ficha de móvil (§7.5). */
  const cells = (dream: DreamListItem, index: number): DreamCells => ({
    dream,
    index,
    onEdit: () => {
      setEditing(dream);
    },
    onDelete: () => {
      setDeleting(dream);
    },
  });

  return (
    <section className="gap-4 animate-page-in flex flex-col">
      <BackLink to="/dreams" label={t('dreams.title')} />

      <DreamsHeader
        stats={stats}
        onAdd={() => {
          setCreating(true);
        }}
      >
        <DateRangeButton
          from={screen.filters.from}
          to={screen.filters.to}
          onChange={screen.filters.setRange}
        />
      </DreamsHeader>

      <DreamsTable screen={screen} cells={cells} toolbar={<DreamsToolbar screen={screen} />} />

      {/* Al editar viaja el identificador y el formulario carga el sueño
          entero: la fila solo trae un extracto del cuerpo. */}
      {(creating || editing) && (
        <DreamForm
          open
          dreamId={editing?.id}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <DeleteDreamDialog
        dream={deleting}
        onClose={() => {
          setDeleting(null);
        }}
      />
    </section>
  );
}
