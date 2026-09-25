import { useAddTableBelievers, useBelieversInfinite, useTableBelieverIds } from '@navis/api-client';
import { believerName, type BelieversQuery } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AddMembersFilters } from '@/components/believers/add-members-filters';
import { BelieverPhoto } from '@/components/believers/believer-photo';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * Añadir creyentes a una tabla enlazada, marcándolos en el listado (RFC 0025
 * D7). Es el mismo gesto que `AddMembersDialog` de las listas —el filtro es la
 * herramienta, la pertenencia es la decisión— con una diferencia: aquí la
 * página se hojea en veinte y «Ver más» (D8) acumula la siguiente, porque el
 * catálogo no cabe en una lista interminable.
 *
 * Quien ya está en la tabla sale marcado y deshabilitado, no escondido (D9).
 */
export function AddBelieversDialog({
    open,
    onClose,
    tableId,
    onAdded,
}: {
    open: boolean;
    onClose: () => void;
    tableId: string;
    /** Se llama cuando el lote creó filas nuevas, para animar su llegada (D16). */
    onAdded?: () => void;
}) {
    const { t } = useTranslation();
    const [query, setQuery] = useState<BelieversQuery>({ limit: 20 });
    const [marcados, setMarcados] = useState<string[]>([]);
    const list = useBelieversInfinite(api, query, open);
    const { data: dentro } = useTableBelieverIds(api, tableId, open);
    const add = useAddTableBelievers(api);

    const yaDentro = new Set(dentro?.ids ?? []);
    const personas = list.data?.pages.flatMap((page) => page.items) ?? [];

    const cerrar = () => {
        setMarcados([]);
        onClose();
    };

    const guardar = () => {
        add.mutate(
            { tableId, believerIds: marcados },
            {
                onSuccess: ({ added }) => {
                    if (added > 0) {
                        onAdded?.();
                        toast.success(t('tables.believersAdded', { count: added }));
                    } else {
                        toast.info(t('tables.believersAlreadyIn'));
                    }
                    cerrar();
                },
                onError: () => {
                    toast.error(t('errors.generic'));
                },
            },
        );
    };

    return (
        <Dialog
            open={open}
            onClose={cerrar}
            title={t('tables.addBelievers')}
            width="min(44rem, calc(100vw - 2rem))"
        >
            <div className="gap-4 flex flex-col">
                <AddMembersFilters query={query} onChange={setQuery} />

                <ul className="min-h-40 max-h-[45dvh] overflow-y-auto rounded-lg border">
                    {list.isLoading && (
                        <li className="p-4 text-sm text-muted-foreground">{t('common.loading')}</li>
                    )}

                    {personas.map((person) => {
                        const ya = yaDentro.has(person.id);

                        return (
                            <li
                                key={person.id}
                                className="px-3 gap-3 flex items-center border-b last:border-b-0"
                            >
                                <BelieverPhoto believer={person} />
                                <Checkbox
                                    className="order-first"
                                    disabled={ya}
                                    checked={ya || marcados.includes(person.id)}
                                    label={
                                        believerName(person) +
                                        (ya ? ` · ${t('tables.alreadyInTable')}` : '')
                                    }
                                    onChange={(event) => {
                                        setMarcados((current) =>
                                            event.target.checked
                                                ? [...current, person.id]
                                                : current.filter((one) => one !== person.id),
                                        );
                                    }}
                                />
                            </li>
                        );
                    })}

                    {!list.isLoading && personas.length === 0 && (
                        <li className="p-4 text-sm text-muted-foreground">
                            {t('believers.noResults')}
                        </li>
                    )}
                </ul>

                {list.hasNextPage && (
                    <Button
                        variant="ghost"
                        className="w-full"
                        isLoading={list.isFetchingNextPage}
                        onClick={() => void list.fetchNextPage()}
                    >
                        {t('tables.seeMore')}
                    </Button>
                )}

                <Button
                    size="lg"
                    className="w-full"
                    disabled={marcados.length === 0}
                    isLoading={add.isPending}
                    onClick={guardar}
                >
                    {t('tables.addSelected', { count: marcados.length })}
                </Button>
            </div>
        </Dialog>
    );
}
