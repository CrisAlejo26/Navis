import { useQuery } from '@tanstack/react-query';

import { registeredBelievers, localDashboardRepository } from '@/data/repos/dashboard-repo';
import { useLocalSession } from '@/stores/local-session';

/**
 * El panel de inicio contra los **repositorios** (RFC 0024, Fase 1): la
 * pantalla no sabe si los datos vienen de SQLite local o de la API — esa
 * frontera vive en `src/data/repos/`. Hoy siempre es local; al conectar con
 * el servidor (Fase 3) cambia aquí, no en la pantalla.
 */
export function useDashboardSummary() {
    const session = useLocalSession((state) => state.session);

    return useQuery({
        queryKey: ['dashboard', session?.churchId, session?.userId],
        queryFn: () => {
            if (!session?.churchId || !session.userId) {
                throw new Error('Sin sesión local no hay panel que calcular');
            }
            return localDashboardRepository.summary(session.churchId, session.userId);
        },
        enabled: Boolean(session?.churchId && session.userId),
    });
}

/**
 * El total de creyentes de la **aplicación** (todas las iglesias locales): es
 * la cifra del hero, que no va acotada a la iglesia activa. Va en su consulta
 * aparte para no alargar el contrato `DashboardSummary`, que comparte con la
 * API y con la web.
 */
export function useRegisteredBelievers() {
    return useQuery({
        queryKey: ['dashboard', 'registered-believers'],
        queryFn: () => registeredBelievers(),
    });
}
