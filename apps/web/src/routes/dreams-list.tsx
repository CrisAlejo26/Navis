import { useDreamsStats } from '@navis/api-client';
import type { DreamListItem } from '@navis/shared';
import { Download, MoonStar } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteDreamDialog } from '@/components/dreams/delete-dream-dialog';
import { DreamCard } from '@/components/dreams/dream-card';
import { DreamForm } from '@/components/dreams/dream-form';
import { DreamsExportDialog } from '@/components/dreams/dreams-export-dialog';
import { DreamsHeader } from '@/components/dreams/dreams-header';
import { DataTable } from '@/components/data-table/data-table';
import { BackLink } from '@/components/ui/back-link';
import { Button } from '@/components/ui/button';
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
    const { data: stats } = useDreamsStats(api);

    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<DreamListItem | null>(null);
    const [deleting, setDeleting] = useState<DreamListItem | null>(null);
    const [exporting, setExporting] = useState(false);

    const screen = useDreamsScreen({ onEdit: setEditing, onDelete: setDeleting });
    const { state, range, setRange } = screen;
    const searching = state.request.filters.length > 0 || state.request.search !== '';

    return (
        <section className="gap-4 animate-page-in flex flex-col">
            <BackLink to="/dreams" label={t('dreams.title')} />

            <DreamsHeader
                stats={stats}
                onAdd={() => {
                    setCreating(true);
                }}
            >
                <DateRangeButton from={range.from} to={range.to} onChange={setRange} />
            </DreamsHeader>

            <DataTable
                columns={screen.columns}
                state={state}
                source={screen.source}
                getKey={(dream) => dream.id}
                emptyIcon={MoonStar}
                emptyTitle={searching ? t('dreams.noResults') : t('dreams.emptyTitle')}
                searchLabel={t('dreams.search')}
                // Las filas entran escalonadas, y solo las doce primeras: más allá, la
                // cascada solo hace esperar (§7.8).
                rowClassName={() => 'animate-rise-in'}
                rowStyle={(_dream, index) => ({
                    animationDelay: `${String(Math.min(index, 12) * 35)}ms`,
                })}
                renderCard={(dream, index) => (
                    <DreamCard
                        dream={dream}
                        index={index}
                        onEdit={() => {
                            setEditing(dream);
                        }}
                        onDelete={() => {
                            setDeleting(dream);
                        }}
                    />
                )}
                // El fichero de sueños trae más que la fila del listado (el cuerpo
                // entero, la interpretación…), así que exporta con su propio diálogo
                // y no con el genérico de la tabla (RFC 0009 §7.1).
                toolbarExtra={
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
                }
            />

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

            <DreamsExportDialog
                open={exporting}
                screen={screen}
                onClose={() => {
                    setExporting(false);
                }}
            />
        </section>
    );
}
