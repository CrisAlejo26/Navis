import { isolationSuite } from '../test-support/church-isolation-suite';
import { createBeliever, updateBeliever, setCongregation } from './believers-repo';

const suite = isolationSuite();
// C1/C2: los links y las sedes se validan antes de escribir cualquier fila.
it.each(['tagIds', 'giftIds', 'congregationId'] as const)(
    'C1/C2: crear creyente rechaza %s de Sur',
    async (field) => {
        const { north, south } = suite.churches();
        const values = {
            tagIds: [south.tagId],
            giftIds: [south.giftId],
            congregationId: south.congregationId,
        };
        await expect(
            createBeliever(north.churchId, { firstName: 'Cruce', [field]: values[field] }),
        ).rejects.toThrow();
    },
);
it.each(['tagIds', 'giftIds', 'congregationId'] as const)(
    'C1/C2: editar creyente rechaza %s de Sur',
    async (field) => {
        const { north, south } = suite.churches();
        const values = {
            tagIds: [south.tagId],
            giftIds: [south.giftId],
            congregationId: south.congregationId,
        };
        await expect(
            updateBeliever(north.believerId, north.churchId, { [field]: values[field] }),
        ).rejects.toThrow();
    },
);
it('C2: asignación en lote rechaza una sede de Sur', async () => {
    const { north, south } = suite.churches();
    await expect(
        setCongregation(north.churchId, [north.believerId], south.congregationId),
    ).rejects.toThrow();
});
