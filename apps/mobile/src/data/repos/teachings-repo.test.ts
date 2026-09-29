// Primero el soporte: registra los mocks de expo-crypto/expo-secure-store
// antes de que carguen los módulos que los usan.
import { setupLocalDb } from '@/data/test-support';
import { setDbForTests } from '@/data/db';
import {
    createTeaching,
    deleteTeaching,
    findTeaching,
    listTeachings,
    teachingsStats,
    updateTeaching,
} from '@/data/repos/teachings-repo';
import type { TeachingBody } from '@navis/shared';
import { openDatabaseAsync } from 'expo-sqlite';

jest.mock('expo-sqlite', () => ({
    __esModule: true,
    openDatabaseAsync: jest.fn(),
}));

const texto = (text: string): TeachingBody => ({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

const checklist = (checked: boolean[]): TeachingBody => ({
    type: 'doc',
    content: [
        {
            type: 'taskList',
            content: checked.map((one) => ({
                type: 'taskItem' as const,
                attrs: { checked: one },
                content: [
                    {
                        type: 'paragraph' as const,
                        content: [{ type: 'text' as const, text: 'paso' }],
                    },
                ],
            })),
        },
    ],
});

describe('las enseñanzas en local (docs/planes/pendientes/ensenanzas-movil-plan.md)', () => {
    let db: Awaited<ReturnType<typeof setupLocalDb>>;
    const ownerId = 'usuario-a';
    const otroOwnerId = 'usuario-b';

    beforeAll(async () => {
        db = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
    });

    afterAll(() => {
        db.close();
    });

    beforeEach(async () => {
        await db.clear();
    });

    it('crea una enseñanza y la vuelve a encontrar con su cuerpo tal cual', async () => {
        const body = checklist([true, false]);
        const id = await createTeaching(ownerId, {
            title: 'Sobre la paciencia',
            body,
            receivedAt: '2026-03-14',
        });

        const teaching = await findTeaching(ownerId, id);
        expect(teaching?.title).toBe('Sobre la paciencia');
        expect(teaching?.receivedAt).toBe('2026-03-14');
        expect(teaching?.body).toEqual(body);
    });

    it('rechaza un cuerpo fuera del whitelist y un título vacío', async () => {
        const fueraDelWhitelist = { type: 'doc', content: [{ type: 'heading' }] };
        await expect(
            createTeaching(ownerId, {
                title: 'X',
                // Un nodo que el editor no produce: el esquema lo tiene que rechazar.
                body: fueraDelWhitelist as unknown as TeachingBody,
                receivedAt: '2026-03-14',
            }),
        ).rejects.toThrow();
        await expect(
            createTeaching(ownerId, { title: '  ', body: texto('a'), receivedAt: '2026-03-14' }),
        ).rejects.toThrow();
    });

    it('un dueño no ve ni puede tocar las enseñanzas de otro', async () => {
        const id = await createTeaching(ownerId, {
            title: 'Privada',
            body: texto('Solo mía'),
            receivedAt: '2026-01-01',
        });

        expect(await findTeaching(otroOwnerId, id)).toBeNull();
        await updateTeaching(otroOwnerId, id, { title: 'Robada' });
        await deleteTeaching(otroOwnerId, id);

        expect((await findTeaching(ownerId, id))?.title).toBe('Privada');
        expect((await listTeachings(otroOwnerId, {})).total).toBe(0);
    });

    it('busca sin acentos ni mayúsculas, en el título y en el cuerpo', async () => {
        await createTeaching(ownerId, {
            title: 'Corrección',
            body: texto('Paciencia con los hermanos'),
            receivedAt: '2026-02-01',
        });
        await createTeaching(ownerId, {
            title: 'Otra',
            body: texto('Nada que ver'),
            receivedAt: '2026-02-02',
        });

        const porTitulo = await listTeachings(ownerId, { search: 'CORRECCION' });
        const porCuerpo = await listTeachings(ownerId, { search: 'paciéncia' });
        expect(porTitulo.items.map((one) => one.title)).toEqual(['Corrección']);
        expect(porCuerpo.items.map((one) => one.title)).toEqual(['Corrección']);
    });

    it('lista de más reciente a más antigua, ordena por título y pagina', async () => {
        for (const [title, receivedAt] of [
            ['b', '2026-01-01'],
            ['a', '2026-03-01'],
            ['c', '2026-02-01'],
        ] as const) {
            await createTeaching(ownerId, { title, body: texto(title), receivedAt });
        }

        expect((await listTeachings(ownerId, {})).items.map((one) => one.title)).toEqual([
            'a',
            'c',
            'b',
        ]);
        const porTitulo = await listTeachings(ownerId, { sort: 'title', order: 'asc', limit: 2 });
        expect(porTitulo.items.map((one) => one.title)).toEqual(['a', 'b']);
        expect(porTitulo.totalPages).toBe(2);
    });

    it('la fila del listado lleva el extracto y la cuenta de la checklist', async () => {
        await createTeaching(ownerId, {
            title: 'Con tareas',
            body: checklist([true, false, false]),
            receivedAt: '2026-03-14',
        });
        await createTeaching(ownerId, {
            title: 'Sin tareas',
            body: texto('Solo texto'),
            receivedAt: '2026-03-13',
        });

        const { items } = await listTeachings(ownerId, {});
        expect(items[0]?.checklist).toEqual({ checked: 1, total: 3 });
        expect(items[1]?.checklist).toBeNull();
        expect(items[1]?.excerpt).toBe('Solo texto');
    });

    it('editar el cuerpo actualiza también lo que se busca', async () => {
        const id = await createTeaching(ownerId, {
            title: 'Vieja',
            body: texto('antes'),
            receivedAt: '2026-03-14',
        });
        await updateTeaching(ownerId, id, { body: texto('ahora habla de esperanza') });

        expect((await listTeachings(ownerId, { search: 'esperanza' })).total).toBe(1);
        expect((await listTeachings(ownerId, { search: 'antes' })).total).toBe(0);
    });

    it('borrar es lógico: desaparece de todo', async () => {
        const id = await createTeaching(ownerId, {
            title: 'Adiós',
            body: texto('x'),
            receivedAt: '2026-03-14',
        });
        await deleteTeaching(ownerId, id);

        expect(await findTeaching(ownerId, id)).toBeNull();
        expect((await teachingsStats(ownerId)).total).toBe(0);
        expect((await listTeachings(ownerId, {})).total).toBe(0);
    });

    it('la tasa de checklist es nula sin checklists y cuenta las marcadas con ellas', async () => {
        await createTeaching(ownerId, { title: 'a', body: texto('x'), receivedAt: '2026-03-14' });
        expect((await teachingsStats(ownerId)).checklistRate).toBeNull();

        await createTeaching(ownerId, {
            title: 'b',
            body: checklist([true, true, false, false]),
            receivedAt: '2026-03-15',
        });
        const stats = await teachingsStats(ownerId);
        expect(stats.total).toBe(2);
        expect(stats.checklistRate).toBe(0.5);
        expect(stats.monthly).toHaveLength(12);
    });
});
