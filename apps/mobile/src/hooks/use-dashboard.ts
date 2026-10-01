import { useQuery } from '@tanstack/react-query';

import { localDashboardRepository } from '@/data/repos/dashboard-repo';
import { useActiveChurchId } from './use-active-church-id';
import { useLocalSession } from '@/stores/local-session';

/**
 * El panel de inicio contra los **repositorios** (RFC 0024, Fase 1): la
 * pantalla no sabe si los datos vienen de SQLite local o de la API — esa
 * frontera vive en `src/data/repos/`. Hoy siempre es local; al conectar con
 * el servidor (Fase 3) cambia aquí, no en la pantalla.
 */
export function useDashboardSummary() {
    const session = useLocalSession((state) => state.session);

    const churchId = useActiveChurchId();
    return useQuery({
        queryKey: ['dashboard', churchId, session?.userId],
        queryFn: () => {
            if (!churchId || !session?.userId) {
                throw new Error('Sin sesión local no hay panel que calcular');
            }
            return localDashboardRepository.summary(churchId, session.userId);
        },
        enabled: Boolean(churchId && session?.userId),
    });
}
