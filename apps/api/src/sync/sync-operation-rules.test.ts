import type { SyncOperation } from '@navis/shared';
import { describe, expect, it } from 'vitest';

import { deletesProtectedEntity } from './sync-operation-rules';

const op = (partial: Partial<SyncOperation>): SyncOperation => ({
    operationId: crypto.randomUUID(),
    table: 'churches',
    id: crypto.randomUUID(),
    op: 'upsert',
    baseRevision: 1,
    ...partial,
});

describe('borrados protegidos', () => {
    it('no deja borrar una iglesia, una membresía ni un rol por la vía de campos', () => {
        for (const table of ['churches', 'church_members', 'roles']) {
            expect(deletesProtectedEntity(op({ table, op: 'delete' }))).toBe(true);
            expect(
                deletesProtectedEntity(
                    op({ table, fields: { deleted_at: '2026-10-09T10:00:00.000Z' } }),
                ),
            ).toBe(true);
        }
    });

    it('editar esas entidades sin borrarlas sí es normal', () => {
        expect(deletesProtectedEntity(op({ fields: { name: 'Nueva', deleted_at: null } }))).toBe(
            false,
        );
        expect(deletesProtectedEntity(op({ fields: { name: 'Nueva' } }))).toBe(false);
    });

    it('el resto de entidades se borran con normalidad', () => {
        expect(deletesProtectedEntity(op({ table: 'believer_notes', op: 'delete' }))).toBe(false);
    });
});
