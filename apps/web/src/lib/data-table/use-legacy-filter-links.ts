import { encodeTableFilters, type TableFilter } from '@navis/shared';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router';

import type { DataTableState } from './use-data-table-state';

/**
 * Los enlaces de antes de la tabla nueva: `/dreams/list?emotion=ID` y parecidos.
 *
 * Las tarjetas de la portada y las celdas de las franjas enlazan a «los de esa
 * emoción» o «los de esa noche» con parámetros sueltos. La tabla guarda sus filtros
 * en uno solo (`f`), así que aquí se **traducen una vez**: se pasan a filtros de la
 * tabla, se quitan los parámetros viejos de la URL y se reemplaza la entrada del
 * historial, para que atrás no vuelva a un enlace que ya no se lee.
 *
 * `convert` tiene que ser una función de módulo (estable). El enlace **sustituye** a
 * los filtros que hubiera: quien pulsa «los de esta emoción» quiere solo esos.
 *
 * Los dos cambios (la URL y las preferencias) se hacen de una vez: encadenar dos
 * `setSearchParams` funcionales no compone, el segundo parte de la URL vieja.
 */
export function useLegacyFilterLinks(
    state: DataTableState,
    keys: readonly string[],
    convert: (params: URLSearchParams) => TableFilter[],
): void {
    const [params, setParams] = useSearchParams();
    const { updatePreferences } = state;

    useEffect(() => {
        if (!keys.some((key) => params.has(key))) return;

        const filters = convert(params);
        const next = new URLSearchParams(params);
        for (const key of keys) next.delete(key);
        next.delete('page');
        const encoded = encodeTableFilters(filters);
        if (encoded) next.set('f', encoded);
        else next.delete('f');

        setParams(next, { replace: true });
        updatePreferences({ filters });
    }, [params, keys, convert, setParams, updatePreferences]);
}
