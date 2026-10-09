import type { SyncOperation } from '@navis/shared';

/**
 * Entidades cuyo borrado **no** puede resolverse como una operación de campo: una
 * iglesia arrastra a todos sus miembros y datos, una membresía cambia quién ve
 * qué, y un rol cambia permisos de gente que no está en este teléfono. Esos
 * borrados tienen su propio flujo (con comprobación de impacto y de propiedad) y
 * por la vía de sincronización se rechazan, cualquiera que sea el adaptador.
 */
const PROTECTED_FROM_DELETION = new Set(['churches', 'church_members', 'roles']);

export const PROTECTED_REASON = 'protected-entity';

/** Si la operación borra (explícitamente o poniendo `deleted_at`) una entidad protegida. */
export function deletesProtectedEntity(operation: SyncOperation): boolean {
    if (!PROTECTED_FROM_DELETION.has(operation.table)) return false;
    if (operation.op === 'delete') return true;
    const deletedAt = operation.fields?.deleted_at;
    return deletedAt !== null && deletedAt !== undefined;
}
