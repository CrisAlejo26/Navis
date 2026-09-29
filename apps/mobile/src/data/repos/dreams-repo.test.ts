// Primero el soporte: registra los mocks de expo-crypto/expo-secure-store
// antes de que carguen los módulos que los usan.
import { setupLocalDb } from '@/data/test-support';
import { getDb, setDbForTests } from '@/data/db';
import {
    createDream,
    deleteDream,
    dreamsStats,
    findDream,
    listDreams,
    updateDream,
} from '@/data/repos/dreams-repo';
import { addDreamAudio, deleteDreamAudio } from '@/data/repos/dream-audios-repo';
import { seedSystemEmotions } from '@/data/repos/emotions-seed';
import {
    createEmotion,
    deleteEmotion,
    listEmotions,
    updateEmotion,
} from '@/data/repos/emotions-repo';
import { openDatabaseAsync } from 'expo-sqlite';

jest.mock('expo-sqlite', () => ({
    __esModule: true,
    openDatabaseAsync: jest.fn(),
}));

// El fichero de verdad no existe en Jest: se sustituye el módulo entero.
jest.mock('@/data/audio-storage', () => ({
    __esModule: true,
    audioUri: (id: string) => `file:///audios/${id}`,
    storeAudio: (id: string) => Promise.resolve(`file:///audios/${id}`),
    removeAudioAt: jest.fn(),
    removeAudio: jest.fn(),
}));

describe('los sueños en local (docs/planes/pendientes/suenos-movil-plan.md)', () => {
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
        await seedSystemEmotions(await getDb());
    });

    async function emotionId(slug: string): Promise<string> {
        const emotions = await listEmotions(ownerId);
        const found = emotions.find((one) => one.slug === slug);
        if (!found) throw new Error(`Falta la emoción ${slug}`);
        return found.id;
    }

    it('siembra las doce emociones de serie sin repetirlas al volver a sembrar', async () => {
        await seedSystemEmotions(await getDb());

        const emotions = await listEmotions(ownerId);
        expect(emotions).toHaveLength(12);
        expect(emotions.every((one) => one.name === null && one.slug !== null)).toBe(true);
    });

    it('apunta un sueño con solo el cuerpo y lo vuelve a encontrar por su dueño', async () => {
        const id = await createDream(ownerId, {
            body: 'Volaba sobre el río',
            dreamedAt: '2026-03-14',
        });

        const dream = await findDream(ownerId, id);
        expect(dream?.title).toBeNull();
        expect(dream?.body).toBe('Volaba sobre el río');
        expect(dream?.fulfilledAt).toBeNull();
        expect(dream?.emotions).toEqual([]);
        expect(dream?.audios).toEqual([]);
    });

    it('D1: un dueño no ve ni puede tocar los sueños de otro', async () => {
        const id = await createDream(ownerId, { body: 'Uno', dreamedAt: '2026-03-14' });

        expect(await findDream(otroOwnerId, id)).toBeNull();
        expect((await listDreams(otroOwnerId, {})).total).toBe(0);
        await updateDream(otroOwnerId, id, { body: 'Robado' });
        await deleteDream(otroOwnerId, id);

        expect((await findDream(ownerId, id))?.body).toBe('Uno');
    });

    it('guarda las emociones del sueño y descarta las que no puede usar', async () => {
        const paz = await emotionId('paz');
        const ajena = await createEmotion(otroOwnerId, { name: 'Nostalgia', accent: 'primary' });

        const id = await createDream(ownerId, {
            body: 'Un campo',
            dreamedAt: '2026-03-14',
            emotionIds: [paz, ajena],
        });

        expect((await findDream(ownerId, id))?.emotions.map((one) => one.slug)).toEqual(['paz']);
    });

    it('deriva el estado de la interpretación y del cumplimiento, sin columna (D8)', async () => {
        await createDream(ownerId, { body: 'Uno', dreamedAt: '2026-03-01' });
        await createDream(ownerId, {
            body: 'Dos',
            dreamedAt: '2026-03-02',
            interpretation: 'Un cambio',
        });
        const tercero = await createDream(ownerId, { body: 'Tres', dreamedAt: '2026-03-03' });
        await updateDream(ownerId, tercero, { fulfilledAt: '2026-03-10' });

        const states = async (state: 'apuntado' | 'estudio' | 'cumplido') =>
            (await listDreams(ownerId, { state: [state] })).items.map((one) => one.excerpt);
        expect(await states('apuntado')).toEqual(['Uno']);
        expect(await states('estudio')).toEqual(['Dos']);
        expect(await states('cumplido')).toEqual(['Tres']);
    });

    it('filtra por texto sin acentos, por tramo de noches y por emoción', async () => {
        const miedo = await emotionId('miedo');
        await createDream(ownerId, {
            title: 'La persecución',
            body: 'Corría sin parar',
            dreamedAt: '2026-01-10',
            emotionIds: [miedo],
        });
        await createDream(ownerId, { body: 'Un jardín', dreamedAt: '2026-05-10' });

        const search = await listDreams(ownerId, { search: 'persecucion' });
        expect(search.items.map((one) => one.title)).toEqual(['La persecución']);

        const range = await listDreams(ownerId, { from: '2026-04-01', to: '2026-06-01' });
        expect(range.items.map((one) => one.excerpt)).toEqual(['Un jardín']);

        const byYear = await listDreams(ownerId, { year: 2025 });
        expect(byYear.total).toBe(0);

        const byEmotion = await listDreams(ownerId, { emotion: [miedo] });
        expect(byEmotion.items).toHaveLength(1);
        expect(byEmotion.items[0]?.emotions[0]?.slug).toBe('miedo');

        // Un identificador vacío no revienta ni se toma por «sin filtro».
        expect((await listDreams(ownerId, { emotion: [''] })).total).toBe(2);
    });

    it('D12: no puede haberse cumplido antes de soñarse', async () => {
        const id = await createDream(ownerId, { body: 'Uno', dreamedAt: '2026-03-14' });

        await expect(updateDream(ownerId, id, { fulfilledAt: '2026-03-01' })).rejects.toThrow(
            'antes de soñarse',
        );
    });

    it('reabrir un sueño cumplido se lleva por delante lo que significó (D10)', async () => {
        const id = await createDream(ownerId, { body: 'Uno', dreamedAt: '2026-03-14' });
        await updateDream(ownerId, id, {
            fulfilledAt: '2026-04-01',
            fulfillmentMeaning: 'Era el trabajo nuevo',
        });
        expect((await findDream(ownerId, id))?.fulfillmentMeaning).toBe('Era el trabajo nuevo');

        await updateDream(ownerId, id, { fulfilledAt: null });

        const dream = await findDream(ownerId, id);
        expect(dream?.fulfilledAt).toBeNull();
        expect(dream?.fulfillmentMeaning).toBeNull();
    });

    it('cuenta la portada: totales, racha y emociones usadas', async () => {
        const paz = await emotionId('paz');
        const hoy = new Date();
        const day = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
        await createDream(ownerId, { body: 'Hoy', dreamedAt: day, emotionIds: [paz] });

        const stats = await dreamsStats(ownerId);

        expect(stats.total).toBe(1);
        expect(stats.streak).toBe(1);
        expect(stats.byEmotion.map((one) => [one.slug, one.count])).toEqual([['paz', 1]]);
        expect(stats.nights).toHaveLength(84);
    });

    it('borra el sueño y sus audios', async () => {
        const id = await createDream(ownerId, { body: 'Uno', dreamedAt: '2026-03-14' });
        await addDreamAudio(ownerId, id, {
            sourceUri: 'file:///tmp/a.m4a',
            mimeType: 'audio/m4a',
            sizeBytes: 10,
            durationSeconds: 3,
            recorded: true,
        });
        expect((await findDream(ownerId, id))?.audios).toHaveLength(1);

        await deleteDream(ownerId, id);

        expect(await findDream(ownerId, id)).toBeNull();
        const rows = await (await getDb()).getAllAsync('SELECT id FROM dream_audios');
        expect(rows).toHaveLength(0);
    });

    it('quita un audio suelto solo a su dueño', async () => {
        const id = await createDream(ownerId, { body: 'Uno', dreamedAt: '2026-03-14' });
        await addDreamAudio(ownerId, id, {
            sourceUri: 'file:///tmp/a.m4a',
            mimeType: 'audio/m4a',
            sizeBytes: 10,
            durationSeconds: null,
            recorded: false,
        });
        const audioId = (await findDream(ownerId, id))?.audios[0]?.id ?? '';

        await deleteDreamAudio(otroOwnerId, audioId);
        expect((await findDream(ownerId, id))?.audios).toHaveLength(1);

        await deleteDreamAudio(ownerId, audioId);
        expect((await findDream(ownerId, id))?.audios).toHaveLength(0);
    });

    describe('el vocabulario de emociones (D6)', () => {
        it('las de serie no se editan ni se borran', async () => {
            const paz = await emotionId('paz');

            await expect(updateEmotion(ownerId, paz, { name: 'Otra' })).rejects.toThrow();
            await expect(deleteEmotion(ownerId, paz)).rejects.toThrow();
        });

        it('las propias se crean, se cambian y se borran sin borrar los sueños', async () => {
            const propia = await createEmotion(ownerId, { name: 'Nostalgia', accent: 'primary' });
            const id = await createDream(ownerId, {
                body: 'Uno',
                dreamedAt: '2026-03-14',
                emotionIds: [propia],
            });
            await updateEmotion(ownerId, propia, { name: 'Añoranza' });
            expect((await listEmotions(ownerId)).find((one) => one.id === propia)?.count).toBe(1);

            await deleteEmotion(ownerId, propia);

            expect((await findDream(ownerId, id))?.emotions).toEqual([]);
            expect((await listEmotions(ownerId)).some((one) => one.id === propia)).toBe(false);
        });

        it('las propias de un dueño no las ve otro', async () => {
            await createEmotion(ownerId, { name: 'Nostalgia', accent: 'primary' });

            expect(await listEmotions(otroOwnerId)).toHaveLength(12);
            expect(await listEmotions(ownerId)).toHaveLength(13);
        });
    });
});
