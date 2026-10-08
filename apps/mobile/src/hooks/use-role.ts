import { useRoleCatalog } from './use-users';

/**
 * Un rol por id, sacado del catálogo ya cargado: son pocas filas y la API no tiene
 * `GET /roles/:id`, así que no hace falta una consulta más (ni un puerto más).
 */
export function useRole(id: string) {
    const catalog = useRoleCatalog();
    return { catalog, role: catalog.data?.find((one) => one.id === id) };
}
