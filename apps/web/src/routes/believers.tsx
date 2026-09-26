import { useAddListMembers, useSetCongregation } from '@navis/api-client';
import { believerName, type BelieverListItem } from '@navis/shared';
import { ClipboardList, Download, MapPin, UserSearch } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BelieverCard, type BelieverCells } from '@/components/believers/believer-card';
import { BelieverForm } from '@/components/believers/believer-form';
import { BelieversCards } from '@/components/believers/believers-cards';
import { BelieversExportDialog } from '@/components/believers/believers-export-dialog';
import { BelieversHeader } from '@/components/believers/believers-header';
import { BelieversViewSwitch } from '@/components/believers/believers-view-switch';
import { DeleteBelieverDialog } from '@/components/believers/delete-believer-dialog';
import { NoteForm } from '@/components/believers/note-form';
import { actionsOf } from '@/components/believers/use-believer-columns';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useBelieversScreen } from '@/lib/believers/use-believers-screen';
import { useBelieversViewStore } from '@/lib/believers/view';
import { defineBulkAction } from '@/lib/data-table/bulk-actions';

/**
 * El listado de creyentes (RFC 0003 §7).
 *
 * La pregunta que responde de un vistazo no es «¿quién está en la iglesia?»,
 * es **«¿con quién no he hablado?»**. De ahí sale todo lo demás: la sonda de
 * cada fila, el orden por última nota y el filtro de «piden atención».
 */
export function BelieversPage() {
    const { t } = useTranslation();
    const view = useBelieversViewStore((state) => state.view);

    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<BelieverListItem | null>(null);
    const [noting, setNoting] = useState<BelieverListItem | null>(null);
    const [deleting, setDeleting] = useState<BelieverListItem | null>(null);
    // `null` cerrado; `[]`, los filtros de la pantalla; con ids, la selección (D1).
    const [exporting, setExporting] = useState<string[] | null>(null);

    const handlers = { onNote: setNoting, onEdit: setEditing, onDelete: setDeleting };
    const screen = useBelieversScreen(handlers);
    const setCongregation = useSetCongregation(api);
    const addMembers = useAddListMembers(api);
    const searching = screen.state.request.filters.length > 0 || screen.state.request.search !== '';
    const activeLists = screen.lists.filter((one) => one.isActive);

    // Ninguna borra nada: exportar, poner sede y añadir a una lista (RFC 0003 §7.4,
    // RFC 0009 D1, RFC 0010 §8.7). Borrar a veinte personas de un clic no es una
    // comodidad, es un accidente esperando.
    const exportSelection = defineBulkAction<BelieverListItem>({
        id: 'export-believers',
        label: t('dataTable.export.selection'),
        description: t('dataTable.export.selectionHelp'),
        icon: Download,
        tone: 'success',
        keepSelection: true,
        run: (people) => {
            setExporting(people.map((one) => one.id));
        },
    });
    // Poner sede cambia fichas y pide permiso; exportar, no.
    const assignCongregation = defineBulkAction<BelieverListItem>({
        id: 'congregation',
        label: t('believers.assignCongregation'),
        description: t('believers.bulkCongregationHelp'),
        icon: MapPin,
        tone: 'primary',
        choice: {
            title: t('believers.assignCongregation'),
            description: t('believers.bulkCongregationHelp'),
            confirmLabel: t('believers.assignCongregation'),
            label: t('believers.congregation'),
            emptyLabel: t('believers.noCongregation'),
            options: screen.congregations.map((one) => ({ value: one.id, label: one.name })),
        },
        run: async (people, picked) => {
            await setCongregation.mutateAsync({
                believerIds: people.map((one) => one.id),
                congregationId: picked || null,
            });
        },
    });
    // Meter a alguien en una lista es otro permiso: es de listas, no de fichas.
    const addToList = defineBulkAction<BelieverListItem>({
        id: 'list',
        label: t('lists.addToList'),
        description: t('believers.bulkListHelp'),
        icon: ClipboardList,
        tone: 'primary',
        choice: {
            title: t('lists.addToList'),
            description: t('believers.bulkListHelp'),
            confirmLabel: t('lists.addToList'),
            label: t('lists.filterByList'),
            options: activeLists.map((one) => ({ value: one.id, label: one.name })),
        },
        run: async (people, picked) => {
            if (!picked) return;
            await addMembers.mutateAsync({
                listId: picked,
                believerIds: people.map((one) => one.id),
            });
        },
    });
    const bulkActions = [
        exportSelection,
        ...(screen.canManage ? [assignCongregation] : []),
        ...(screen.canManageLists && activeLists.length > 0 ? [addToList] : []),
    ];

    /** Lo mismo alimenta la ficha de la lista de móvil y la de la rejilla (§7.4). */
    const cells = (believer: BelieverListItem, index: number): BelieverCells => ({
        believer,
        ministries: screen.ministries,
        lists: screen.lists,
        listIds: screen.memberships[believer.id],
        today: screen.today,
        canManage: screen.canManage,
        index,
        ...actionsOf(believer, handlers),
    });

    return (
        <section className="gap-6 flex flex-col">
            <BelieversHeader
                summary={screen.summary}
                canManage={screen.canManage}
                onAdd={() => {
                    setCreating(true);
                }}
            />

            {/* Cambiar de vista es un fundido, sin desplazamiento: no se está yendo a
          otro sitio (§7.8). La clave hace que React remonte y la animación
          vuelva a lanzarse. */}
            <div key={view} className="animate-page-in">
                <DataTable
                    columns={screen.columns}
                    state={screen.state}
                    source={screen.source}
                    getKey={(believer) => believer.id}
                    emptyIcon={UserSearch}
                    emptyTitle={searching ? t('believers.noResults') : t('believers.empty')}
                    searchLabel={t('believers.search')}
                    // Las casillas, solo con permiso de gestión, como antes.
                    selectable={screen.canManage}
                    bulkActions={bulkActions}
                    rowLabel={(believer) =>
                        t('believers.selectOne', { name: believerName(believer) })
                    }
                    // El aviso ya es el único dato de color de la pantalla (`Sonda`, §7.3):
                    // aquí se extiende de un filete a un lavado suave del fondo entero.
                    rowClassName={(believer) =>
                        believer.needsAttention
                            ? 'border-l-destructive bg-destructive/5 hover:border-l-destructive hover:bg-destructive/10'
                            : undefined
                    }
                    renderCard={(believer, index) => <BelieverCard {...cells(believer, index)} />}
                    toolbarExtra={
                        <>
                            {/* No es la acción principal —lo es «Añadir»—: secundario y sin
                  rótulo en pantallas estrechas (RFC 0009 §7.1). */}
                            <Button
                                variant="outline"
                                size="sm"
                                className="max-sm:h-11 max-sm:px-3"
                                aria-label={t('export.title')}
                                onClick={() => {
                                    setExporting([]);
                                }}
                            >
                                <Download size={16} aria-hidden className="text-primary" />
                                <span className="sm:inline hidden">{t('export.title')}</span>
                            </Button>
                            <BelieversViewSwitch />
                        </>
                    }
                    body={
                        view === 'cards'
                            ? (items, selection) =>
                                  items.length === 0 ? null : (
                                      <BelieversCards
                                          items={items}
                                          cells={(believer, index) => ({
                                              ...cells(believer, index),
                                              selected: selection?.has(believer.id) ?? false,
                                              onToggleSelected: selection
                                                  ? () => {
                                                        selection.toggle(believer);
                                                    }
                                                  : undefined,
                                          })}
                                      />
                                  )
                            : undefined
                    }
                />
            </div>

            {(creating || editing) && (
                <BelieverForm
                    open
                    believer={editing ?? undefined}
                    congregations={screen.congregations}
                    gifts={screen.gifts}
                    tags={screen.tags}
                    onClose={() => {
                        setCreating(false);
                        setEditing(null);
                    }}
                />
            )}

            {noting && (
                <NoteForm
                    open
                    believerId={noting.id}
                    gifts={screen.gifts}
                    onClose={() => {
                        setNoting(null);
                    }}
                />
            )}

            <DeleteBelieverDialog
                believer={deleting}
                onClose={() => {
                    setDeleting(null);
                }}
            />

            {/* Con filas marcadas se lleva la selección; sin ellas, los filtros (D1). */}
            <BelieversExportDialog
                open={exporting !== null}
                selected={exporting ?? []}
                screen={screen}
                onClose={() => {
                    setExporting(null);
                }}
            />
        </section>
    );
}
