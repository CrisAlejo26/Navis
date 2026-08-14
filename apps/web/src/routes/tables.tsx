import { useTables } from '@navis/api-client';
import { Table2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TableForm } from '@/components/tables/table-form';
import { TablePanel } from '@/components/tables/table-panel';
import { TablesHeader } from '@/components/tables/tables-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { api } from '@/lib/api';
import { usePermissions } from '@/lib/permissions';

const CASCADA_MS = 40;
const CASCADA_MAX = 400;

/**
 * **El tablón de tablas** (RFC 0021 D32), mismo criterio que el de Listas: un
 * panel relleno de su color por tabla, para que la sección no se quede en
 * blanco con pocos datos.
 */
export function TablesPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { data: tables, isLoading } = useTables(api);
  const [creando, setCreando] = useState(false);

  if (isLoading || !tables) return <PageSkeleton />;

  const activas = tables.filter((one) => one.isActive);
  const onAdd = can('tables.manage')
    ? () => {
        setCreando(true);
      }
    : undefined;

  return (
    <section className="gap-6 animate-page-in flex flex-col">
      <TablesHeader onAdd={onAdd} />

      {activas.length === 0 ? (
        <EmptyState
          icon={Table2}
          title={t('tables.emptyTitle')}
          action={
            onAdd && (
              <Button size="lg" onClick={onAdd}>
                {t('tables.newTable')}
              </Button>
            )
          }
        >
          {t('tables.emptyBody')}
        </EmptyState>
      ) : (
        <div className="gap-4 sm:grid-cols-2 xl:grid-cols-3 grid">
          {activas.map((table, index) => (
            <TablePanel
              key={table.id}
              table={table}
              delay={Math.min(index * CASCADA_MS, CASCADA_MAX)}
            />
          ))}
        </div>
      )}

      <TableForm
        open={creando}
        onClose={() => {
          setCreando(false);
        }}
      />
    </section>
  );
}
