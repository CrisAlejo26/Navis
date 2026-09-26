import {
    useBelievers,
    useBelieversSummary,
    useBelieverTags,
    useCongregations,
    useGifts,
    useListMemberships,
    useLists,
    useMinistries,
} from '@navis/api-client';
import {
    todayIn,
    type BelieverListItem,
    type BelieverTag,
    type BelieversSummary,
    type Congregation,
    type Gift,
    type IsoDate,
    type ListMemberships,
    type ListSummary,
    type MinistryCatalog,
    type TableSort,
} from '@navis/shared';
import { useMemo } from 'react';

import {
    useBelieverColumns,
    type BelieverRowHandlers,
} from '@/components/believers/use-believer-columns';
import { api } from '@/lib/api';
import {
    LEGACY_BELIEVER_PARAMS,
    believerFiltersFromLegacy,
    toBelieversQuery,
} from '@/lib/believers/believers-query';
import type { DataTableColumn } from '@/lib/data-table/columns';
import { serverSource, sourceItems, type DataTableSource } from '@/lib/data-table/source';
import { useDataTableState, type DataTableState } from '@/lib/data-table/use-data-table-state';
import { useLegacyFilterLinks } from '@/lib/data-table/use-legacy-filter-links';
import { usePermissions } from '@/lib/permissions';

const DEFAULT_SORTS: readonly TableSort[] = [{ columnId: 'name', dir: 'asc' }];
/** La API ordena por una sola columna. */
const TABLE_OPTIONS = { singleSort: true };

export interface BelieversScreen {
    /** Las que se pintan: sin la de fotografía si nadie de la página tiene. */
    columns: DataTableColumn<BelieverListItem>[];
    state: DataTableState;
    source: DataTableSource<BelieverListItem>;
    summary: BelieversSummary | undefined;
    congregations: Congregation[];
    gifts: Gift[];
    /** El catálogo de labores, para resolver a nombre y color los slugs de cada fila. */
    ministries: MinistryCatalog[];
    /** El catálogo de etiquetas de creyente de la iglesia. */
    tags: BelieverTag[];
    /**
     * Las listas de la iglesia y en cuáles está cada persona (RFC 0010 §8.7).
     *
     * Salen de **una sola llamada por iglesia** que se cachea, y no de un `join`
     * dentro del listado paginado: con relaciones cargadas, `take`/`skip` de
     * TypeORM se van a una subconsulta con `DISTINCT` (CLAUDE.md).
     */
    lists: ListSummary[];
    memberships: ListMemberships;
    today: IsoDate;
    canManage: boolean;
    /** Meter a alguien en una lista es otro permiso: es de listas, no de fichas. */
    canManageLists: boolean;
}

/**
 * Todo lo que necesita la pantalla de creyentes, en un sitio.
 *
 * Se separa de la vista porque son dos cosas distintas: aquí están las consultas, el
 * estado de la tabla y los permisos; en el componente, cómo se pinta (Regla 6 §2).
 */
export function useBelieversScreen(handlers: BelieverRowHandlers): BelieversScreen {
    const { can } = usePermissions();
    const summary = useBelieversSummary(api);
    const { data: congregations = [] } = useCongregations(api);
    const { data: gifts = [] } = useGifts(api);
    const { data: ministries = [] } = useMinistries(api);
    const { data: tags = [] } = useBelieverTags(api);
    // Los nombres de las listas también son información: sin `lists.view` no se
    // piden ni se pintan los puntos (§7.1).
    const puedeVerListas = can('lists.view');
    const { data: lists = [] } = useLists(api, puedeVerListas);
    const { data: memberships = {} } = useListMemberships(api, puedeVerListas);
    // El día de quien mira: la sonda del cliente y la del servidor pueden
    // discrepar en el cambio de día, y la del cliente es la que se está viendo.
    const today = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const canManage = can('believers.manage');

    const all = useBelieverColumns({
        ministries,
        lists,
        memberships,
        congregations,
        gifts,
        tags,
        today,
        canManage,
        handlers,
    });
    const state = useDataTableState('believers', all, DEFAULT_SORTS, TABLE_OPTIONS);
    // Las tarjetas de la portada y de las listas enlazan con parámetros sueltos
    // (`?attention=true`, `?inLists=4`): se traducen una vez a filtros de la tabla.
    useLegacyFilterLinks(state, LEGACY_BELIEVER_PARAMS, believerFiltersFromLegacy);

    const result = useBelievers(api, toBelieversQuery(state.request));
    const source = serverSource(result);

    // La columna de fotografía solo existe si alguien de esta página tiene una: una
    // columna vacía para diecinueve de veinte roba ancho a lo que sí se lee.
    const showPhoto = (sourceItems(source) ?? []).some((believer) => believer.hasPhoto);
    const columns = useMemo(
        () => (showPhoto ? all : all.filter((column) => column.id !== 'photo')),
        [all, showPhoto],
    );

    return {
        columns,
        state,
        source,
        summary: summary.data,
        congregations,
        gifts,
        ministries,
        tags,
        lists,
        memberships,
        today,
        canManage,
        canManageLists: can('lists.manage'),
    };
}
