import { createQueryClient } from '@navis/api-client';

/**
 * Instancia única de TanStack Query. Vive fuera del árbol de React para que
 * sobreviva a los recargados en caliente de Metro.
 */
export const queryClient = createQueryClient();
