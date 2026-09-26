import { Bookmark, Check, Trash2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { FloatingPanel } from '@/components/ui/floating-panel';
import { IconAction } from '@/components/ui/icon-action';
import { Tooltip } from '@/components/ui/tooltip';
import { MAX_SAVED_VIEWS, type SavedTableView } from '@/lib/data-table/table-preferences';
import { activeView, withSavedView, type ViewSnapshot } from '@/lib/data-table/table-views';
import type { DataTableState } from '@/lib/data-table/use-data-table-state';
import { toast } from '@/lib/toast';

// 16 px como el resto de campos: por debajo, Safari/iOS hace zoom al enfocar (Regla 5).
const FIELD =
    'h-9 w-full min-w-0 rounded-lg border bg-card px-2.5 text-base text-foreground outline-none transition-[border-color,box-shadow] duration-200 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35';

/**
 * «Vistas»: la combinación de filtros, orden y columnas que tiene nombre y vuelve
 * con un clic («Pendientes de esta semana»). Se guardan en el navegador, junto al
 * resto de preferencias de la tabla; nada viaja al servidor.
 */
export function ViewsMenu({ state }: { state: DataTableState }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const anchor = useRef<HTMLDivElement>(null);
    const close = useCallback(() => {
        setOpen(false);
    }, []);

    const { preferences, request } = state;
    const { views } = preferences;
    const current: ViewSnapshot = {
        filters: request.filters,
        sorts: request.sorts,
        columnVisibility: preferences.columnVisibility,
        columnOrder: preferences.columnOrder,
    };
    const active = activeView(views, current);

    const save = () => {
        const next = withSavedView(views, name, current, () => crypto.randomUUID());
        if (!next) {
            if (name.trim()) toast.error(t('dataTable.views.limit'));
            return;
        }
        state.updatePreferences({ views: next });
        setName('');
        toast.success(t('dataTable.views.saved'));
    };

    const apply = (view: SavedTableView) => {
        state.setFilters(view.filters);
        state.setSorts(view.sorts);
        state.updatePreferences({
            columnVisibility: view.columnVisibility,
            columnOrder: view.columnOrder,
        });
        close();
    };

    return (
        <>
            <div ref={anchor} className="inline-flex">
                <Tooltip label={t('dataTable.views.title')} description={t('dataTable.views.help')}>
                    <Button
                        variant="outline"
                        size="sm"
                        className="max-sm:h-11 max-sm:px-3"
                        aria-expanded={open}
                        aria-haspopup="dialog"
                        onClick={() => {
                            setOpen((value) => !value);
                        }}
                    >
                        <Bookmark size={16} aria-hidden className="text-primary" />
                        <span className="max-sm:sr-only">{t('dataTable.views.title')}</span>
                    </Button>
                </Tooltip>
            </div>
            <FloatingPanel
                anchorRef={anchor}
                open={open}
                onClose={close}
                label={t('dataTable.views.title')}
                width={320}
            >
                <div className="gap-3 p-3 flex flex-col">
                    <p className="text-xs text-muted-foreground">{t('dataTable.views.help')}</p>

                    {views.length === 0 ? (
                        <p className="py-2 text-sm text-center text-muted-foreground">
                            {t('dataTable.views.empty')}
                        </p>
                    ) : (
                        <ul className="max-h-56 overflow-y-auto">
                            {views.map((view) => (
                                <li key={view.id} className="gap-1 flex items-center">
                                    <button
                                        type="button"
                                        aria-label={t('dataTable.views.apply', { name: view.name })}
                                        onClick={() => {
                                            apply(view);
                                        }}
                                        className="h-10 gap-2 px-2 text-sm min-w-0 flex flex-1 cursor-pointer items-center rounded-lg text-left hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                    >
                                        <span className="truncate">{view.name}</span>
                                        {active?.id === view.id && (
                                            <span className="gap-1 text-xs ml-auto inline-flex shrink-0 items-center text-primary">
                                                <Check size={13} aria-hidden />
                                                {t('dataTable.views.active')}
                                            </span>
                                        )}
                                    </button>
                                    <IconAction
                                        tone="destructive"
                                        className="h-8 w-8"
                                        aria-label={t('dataTable.views.remove', {
                                            name: view.name,
                                        })}
                                        onClick={() => {
                                            state.updatePreferences({
                                                views: views.filter((one) => one.id !== view.id),
                                            });
                                        }}
                                    >
                                        <Trash2 size={14} aria-hidden />
                                    </IconAction>
                                </li>
                            ))}
                        </ul>
                    )}

                    <form
                        className="gap-2 flex"
                        onSubmit={(event) => {
                            event.preventDefault();
                            save();
                        }}
                    >
                        <input
                            value={name}
                            maxLength={60}
                            aria-label={t('dataTable.views.nameLabel')}
                            placeholder={t('dataTable.views.nameLabel')}
                            onChange={(event) => {
                                setName(event.target.value);
                            }}
                            className={FIELD}
                        />
                        <Button
                            type="submit"
                            size="sm"
                            className="h-9 shrink-0"
                            disabled={!name.trim()}
                        >
                            {t('dataTable.views.save')}
                        </Button>
                    </form>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                        {views.length} / {MAX_SAVED_VIEWS}
                    </p>
                </div>
            </FloatingPanel>
        </>
    );
}
