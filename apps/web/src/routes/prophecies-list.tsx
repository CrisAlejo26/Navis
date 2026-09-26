import { usePropheciesStats } from '@navis/api-client';
import { todayIn, type ProphecyListItem } from '@navis/shared';
import { Download, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DataTable } from '@/components/data-table/data-table';
import { DeleteProphecyDialog } from '@/components/prophecies/delete-prophecy-dialog';
import { FulfillmentForm } from '@/components/prophecies/fulfillment-form';
import { PropheciesCardGrid } from '@/components/prophecies/prophecies-card-grid';
import { PropheciesExportDialog } from '@/components/prophecies/prophecies-export-dialog';
import { PropheciesHeader } from '@/components/prophecies/prophecies-header';
import { PropheciesViewSwitch } from '@/components/prophecies/prophecies-view-switch';
import { PropheciesYear } from '@/components/prophecies/prophecies-year';
import { ProphecyCard, type ProphecyCells } from '@/components/prophecies/prophecy-card';
import { ProphecyForm } from '@/components/prophecies/prophecy-form';
import { Travesia } from '@/components/prophecies/travesia';
import { BackLink } from '@/components/ui/back-link';
import { Button } from '@/components/ui/button';
import { DateRangeButton } from '@/components/ui/date-range-button';
import { api } from '@/lib/api';
import { usePropheciesScreen } from '@/lib/prophecies/use-prophecies-screen';
import { usePropheciesViewStore } from '@/lib/prophecies/view';

/**
 * El listado de profecías, con sus cuatro formas de verlo (RFC 0004 §7.4).
 *
 * La pregunta que responde no es «¿qué me dijeron?», es **«¿qué ha pasado con
 * lo que me dijeron?»**. De ahí sale todo: la travesía de serie, el filtro por
 * estado y el orden por fecha de recepción.
 *
 * Las cuatro vistas comparten la misma tabla de datos —barra, filtros, chips y
 * paginación—: la tabla y las fichas por defecto, y la travesía, las fichas en
 * rejilla y el año entran por el `body` de `DataTable`.
 */
export function PropheciesListPage() {
    const { t } = useTranslation();
    const { data: stats } = usePropheciesStats(api);
    const view = usePropheciesViewStore((state) => state.view);

    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<ProphecyListItem | null>(null);
    const [fulfilling, setFulfilling] = useState<ProphecyListItem | null>(null);
    const [deleting, setDeleting] = useState<ProphecyListItem | null>(null);
    const [exporting, setExporting] = useState(false);

    const screen = usePropheciesScreen({
        onEdit: setEditing,
        onFulfill: setFulfilling,
        onDelete: setDeleting,
    });
    const { state, range, setRange } = screen;
    const searching = state.request.filters.length > 0 || state.request.search !== '';
    // El día de quien mira: el del servidor y el del cliente pueden discrepar en el
    // cambio de día, y el que se está viendo es este.
    const today = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);

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

    return (
        <section className="gap-4 flex flex-col">
            <BackLink to="/prophecies" label={t('prophecies.title')} />

            <PropheciesHeader
                stats={stats}
                onAdd={() => {
                    setCreating(true);
                }}
            >
                <DateRangeButton from={range.from} to={range.to} onChange={setRange} />
            </PropheciesHeader>

            {/* Cambiar de vista es un fundido, sin desplazamiento: no se está yendo a
          otro sitio (§7.8). La clave hace que React remonte y la animación
          vuelva a lanzarse. */}
            <div key={view} className="animate-page-in">
                <DataTable
                    columns={screen.columns}
                    state={state}
                    source={screen.source}
                    getKey={(prophecy) => prophecy.id}
                    emptyIcon={Sparkles}
                    emptyTitle={searching ? t('prophecies.noResults') : t('prophecies.emptyTitle')}
                    searchLabel={t('prophecies.search')}
                    // Las filas entran escalonadas, y solo las doce primeras: más allá, la
                    // cascada solo hace esperar (§7.8).
                    rowClassName={() => 'animate-rise-in'}
                    rowStyle={(_prophecy, index) => ({
                        animationDelay: `${String(Math.min(index, 12) * 35)}ms`,
                    })}
                    renderCard={(prophecy, index) => <ProphecyCard {...cells(prophecy, index)} />}
                    body={
                        view === 'table'
                            ? undefined
                            : (items) => {
                                  // Sin filas la tabla ya dice por qué: un eje sin trayectos sobra.
                                  if (items.length === 0) return null;
                                  if (view === 'travesia') {
                                      return <Travesia items={[...items]} today={today} />;
                                  }
                                  if (view === 'year') {
                                      return <PropheciesYear items={[...items]} today={today} />;
                                  }
                                  return <PropheciesCardGrid items={items} cells={cells} />;
                              }
                    }
                    // El fichero de profecías trae más que la fila del listado, así que
                    // exporta con su propio diálogo (RFC 0009 §7.1).
                    toolbarExtra={
                        <div className="gap-2 flex items-center">
                            <Button
                                variant="outline"
                                className="max-sm:h-11"
                                aria-label={t('export.title')}
                                onClick={() => {
                                    setExporting(true);
                                }}
                            >
                                <Download size={16} aria-hidden className="text-primary" />
                                <span className="max-sm:sr-only">{t('export.title')}</span>
                            </Button>
                            <PropheciesViewSwitch />
                        </div>
                    }
                />
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

            <PropheciesExportDialog
                open={exporting}
                screen={screen}
                onClose={() => {
                    setExporting(false);
                }}
            />
        </section>
    );
}
