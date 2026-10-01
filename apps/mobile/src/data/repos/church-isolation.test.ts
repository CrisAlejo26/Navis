import { isolationSuite, rejectedOrUnchanged } from '../test-support/church-isolation-suite';
import * as notes from './notes-repo';
import * as believers from './believers-repo';
import { localDashboardRepository } from './dashboard-repo';
import { ISOLATION_DAY } from '../test-support/seed-two-churches';

const suite = isolationSuite();
const snapshot = () =>
    Promise.all([
        suite.db().adapter.getAllAsync('SELECT * FROM believer_notes ORDER BY id'),
        suite.db().adapter.getAllAsync('SELECT * FROM believers ORDER BY id'),
    ]);

// A1: el número del inicio nunca puede sumar otras iglesias.
it('A1: la cifra de inicio pertenece a Norte', async () => {
    expect(
        (await localDashboardRepository.summary(suite.churches().north.churchId, 'isolation-owner'))
            .believers.total,
    ).toBe(1);
});
// B2: un id ajeno no permite editar, borrar ni recalcular una nota.
it.each(['updateNote', 'deleteNote'] as const)('B2: %s no toca Sur', async (operation) => {
    const { north, south } = suite.churches();
    await rejectedOrUnchanged(
        () =>
            operation === 'updateNote'
                ? notes.updateNote(
                      south.noteId,
                      south.believerId,
                      { told: 'Intrusión' },
                      north.churchId,
                  )
                : notes.deleteNote(south.noteId, south.believerId, north.churchId),
        snapshot,
    );
});
// B3: contadores y días son lecturas sensibles, aunque el id sea conocido.
it('B3: los contadores no revelan notas de Sur', async () => {
    const { north, south } = suite.churches();
    expect(await notes.noteCounts(south.believerId, north.churchId)).toMatchObject({
        total: 0,
    });
});
it('B3: los días no revelan notas de Sur', async () => {
    const { north, south } = suite.churches();
    expect(
        await notes.noteDays(south.believerId, ISOLATION_DAY, ISOLATION_DAY, north.churchId),
    ).toEqual([]);
});
// C3: ni el don ni el creyente referenciado pueden venir de otra iglesia.
it.each(['gift', 'believer'] as const)('C3: crear nota rechaza %s ajeno', async (reference) => {
    const { north, south } = suite.churches();
    await expect(
        notes.createNote(
            reference === 'believer' ? south.believerId : north.believerId,
            north.churchId,
            null,
            {
                kind: 'seguimiento',
                occurredAt: ISOLATION_DAY,
                told: 'Cruce',
                giftId: reference === 'gift' ? south.giftId : undefined,
            },
        ),
    ).rejects.toThrow();
});
it('C3: editar nota rechaza un don ajeno', async () => {
    const { north, south } = suite.churches();
    await rejectedOrUnchanged(
        () =>
            notes.updateNote(
                north.noteId,
                north.believerId,
                { giftId: south.giftId },
                north.churchId,
            ),
        snapshot,
    );
});
// Regresión adicional: borrar un creyente ajeno no debe borrar sus notas.
it('deleteBeliever no borra las notas de Sur desde Norte', async () => {
    const { north, south } = suite.churches();
    await rejectedOrUnchanged(
        () => believers.deleteBeliever(south.believerId, north.churchId),
        snapshot,
    );
});
// Controles positivos: la fixture existe y los repos ya acotados sí la protegen.
it('las fichas y listados acotados ocultan Sur y permiten Norte', async () => {
    const { north, south } = suite.churches();
    expect(await notes.findNote(south.noteId, north.churchId)).toBeNull();
    expect(await notes.findNote(north.noteId, north.churchId)).toMatchObject({ told: 'N-Nota' });
    expect(await believers.findBeliever(south.believerId, north.churchId)).toBeNull();
    expect((await believers.listBelievers({ churchId: north.churchId })).items).toHaveLength(1);
});
