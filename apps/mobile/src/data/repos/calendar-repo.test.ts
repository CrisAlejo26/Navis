// Primero el soporte: registra los mocks de expo-crypto/expo-secure-store
// antes de que carguen los módulos que los usan.
import { setupLocalDb } from '@/data/test-support';
import { setDbForTests, newId } from '@/data/db';
import {
    DEFAULT_WEEK,
    SEEDED_CALENDARS,
    addMonths,
    endOfMonth,
    startOfMonth,
    toSearchName,
} from '@navis/shared';
import { createChurch } from '@/data/repos/church-repo';
import {
    listCalendars,
    createCalendar,
    createCongregation,
    listCongregations,
    deleteCongregation,
    deleteCalendar,
} from '@/data/repos/calendar-repo';
import { calendarRange } from '@/data/repos/calendar-schedule';
import { assignSlot, createMeeting, updateMeeting } from '@/data/repos/calendar-assignments';
import { createPattern, listPatterns, updatePattern } from '@/data/repos/calendar-settings';
import { calendarSummary } from '@/data/repos/calendar-balance';
import { listPreachers } from '@/data/repos/calendar-preachers';
import { openDatabaseAsync } from 'expo-sqlite';

jest.mock('expo-sqlite', () => ({
    __esModule: true,
    openDatabaseAsync: jest.fn(),
}));

/**
 * El repositorio del calendario en local (paso 2 del plan móvil): la
 * expansión del tramo, la materialización idempotente al asignar, que editar
 * un patrón no toca lo ya materializado (D7), y las reglas de «nunca el
 * último» de sedes y calendarios. Cada prueba usa un tramo de fechas lejano y
 * distinto para no pisarse.
 */
describe('el calendario en local (RFC 0002)', () => {
    let db: Awaited<ReturnType<typeof setupLocalDb>>;
    let churchId: string;
    let pulpitoId: string;
    const ownerId = 'usuario-local';

    beforeAll(async () => {
        db = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
        const church = await createChurch({ name: 'Iglesia del Sur', city: 'Elda', ownerId });
        churchId = church.id;
        pulpitoId = (await listCalendars(churchId)).find((one) => one.slug === 'pulpito')!.id;
    });

    afterAll(() => {
        db.close();
    });

    /** Los días de una semana que empieza `desde`; el primero viernes. */
    function semanaDesde(desde: number): { viernes: string; dias: string[] } {
        const dias = [...Array(8)]
            .map((_one, index) =>
                new Date(Date.now() + (desde + index) * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .slice(0, 10),
            )
            .filter((day) => new Date(`${day}T12:00:00Z`).getUTCDay() === 5);
        return { viernes: dias[0], dias };
    }

    function addBeliever(firstName: string, lastName = ''): string {
        const now = new Date().toISOString();
        const believerId = newId();
        db.memory
            .prepare(
                `INSERT INTO believers (id, created_at, updated_at, deleted_at, church_id, first_name, last_name, status, search_name)
         VALUES (?, ?, ?, NULL, ?, ?, ?, 'activo', ?)`,
            )
            .run(
                believerId,
                now,
                now,
                churchId,
                firstName,
                lastName,
                toSearchName(`${firstName} ${lastName}`),
            );
        return believerId;
    }

    it('el tramo expande los patrones al vuelo: viernes propuesto con sus fases y huecos', async () => {
        const { viernes } = semanaDesde(14);

        const rango = await calendarRange(churchId, pulpitoId, viernes, viernes);
        expect(rango.congregations).toHaveLength(1);
        expect(rango.days[0]?.meetings).toHaveLength(1);

        const reunion = rango.days[0]?.meetings[0];
        expect(reunion?.id).toBeNull(); // propuesta del patrón, sin fila propia
        expect(reunion?.slots).toHaveLength(4);
        expect(
            reunion?.slots.every((slot) => slot.believers.length === 0 && slot.id === null),
        ).toBe(true);
    });

    it('asignar a un día propuesto materializa la reunión con todas sus fases, y repetir no duplica', async () => {
        const { viernes } = semanaDesde(14);
        const juan = addBeliever('Juan Carlos', 'Ruiz');
        const patternId = (await calendarRange(churchId, pulpitoId, viernes, viernes)).days[0]
            ?.meetings[0]?.patternId!;

        await assignSlot(churchId, { date: viernes, patternId, position: 0, believerIds: [juan] });
        await assignSlot(churchId, { date: viernes, patternId, position: 0, believerIds: [juan] });

        const rango = await calendarRange(churchId, pulpitoId, viernes, viernes);
        expect(rango.days[0]?.meetings).toHaveLength(1);

        const reunion = rango.days[0]?.meetings[0];
        expect(reunion?.id).not.toBeNull();
        expect(reunion?.slots).toHaveLength(4);
        expect(reunion?.slots[0]?.believers.map((one) => one.id)).toEqual([juan]);
        expect(reunion?.slots[1]?.believers).toEqual([]);
    });

    it('cada calendario muestra sus propias fases al abrir un día: el sonido no pinta las del púlpito', async () => {
        const { viernes } = semanaDesde(14);
        const sonidoId = (await listCalendars(churchId)).find((one) => one.slug === 'sonido')!.id;

        const pulpito = await calendarRange(churchId, pulpitoId, viernes, viernes);
        const sonido = await calendarRange(churchId, sonidoId, viernes, viernes);

        // El púlpito reparte tramos de reunión…
        const fasesPulpito = pulpito.days[0]?.meetings[0]?.slots.map((slot) => slot.name) ?? [];
        expect(fasesPulpito).toEqual(DEFAULT_WEEK[5]?.phases);

        // …y el sonido, dos puestos por encuentro. Nada mezclado (D15).
        const fasesSonido = sonido.days[0]?.meetings[0]?.slots.map((slot) => slot.name) ?? [];
        expect(fasesSonido).toEqual(['Equipo de sonido', 'Apoyo']);
    });

    it('crear un calendario con plantilla siembra la semana de esa labor en la sede', async () => {
        const vigilancia = await createCalendar(churchId, {
            name: 'Guardia',
            ministry: 'vigilancia',
        });

        // Solo los días de enseñanza —miércoles y domingo—, como en la API.
        const desde = startOfMonth(new Date().toISOString().slice(0, 10));
        const rango = await calendarRange(
            churchId,
            vigilancia.id,
            addMonths(desde, 4),
            endOfMonth(addMonths(desde, 4)),
        );
        const conPatron = rango.days.filter((day) => day.meetings.length > 0);
        expect(conPatron.length).toBeGreaterThan(0);
        for (const day of conPatron) {
            // Miércoles (3) o domingo (0): los dos días de enseñanza.
            expect([0, 3]).toContain(new Date(`${day.date}T12:00:00Z`).getUTCDay());
            const reunion = day.meetings[0];
            expect(reunion?.slots.map((slot) => slot.name)).toEqual(['Guardia']);
        }
        // Y su slug se liberó: «Guardia» deriva «guardia» sin pisar «vigilancia».
        expect(vigilancia.slug).not.toBe('vigilancia');
    });

    it('crear una iglesia nace con calendarios y semana sin problemas', async () => {
        const otra = await createChurch({
            name: 'Iglesia del Norte',
            city: 'Benidorm',
            ownerId: 'u2',
        });
        const calendars = await listCalendars(otra.id);
        expect(calendars).toHaveLength(SEEDED_CALENDARS.length);
        const sedes = await listCongregations(otra.id);
        expect(sedes).toHaveLength(1);
        const pulpito = calendars.find((one) => one.slug === 'pulpito')!;
        const mes = startOfMonth(new Date().toISOString().slice(0, 10));
        const dia = (
            await calendarRange(
                otra.id,
                pulpito.id,
                addMonths(mes, 4),
                endOfMonth(addMonths(mes, 4)),
            )
        ).days.find((one) => one.meetings.length > 0);
        expect(dia?.meetings[0]?.slots.length).toBeGreaterThan(0);
    });

    it('la reunión materializada conserva su nombre aunque se cambie el patrón después (D7)', async () => {
        const { viernes } = semanaDesde(21);
        const patternId = (await calendarRange(churchId, pulpitoId, viernes, viernes)).days[0]
            ?.meetings[0]?.patternId!;

        await assignSlot(churchId, { date: viernes, patternId, position: 0, believerIds: [] });
        await updatePattern(churchId, pulpitoId, { id: patternId, name: 'Culto nuevo' });

        const despues = await calendarRange(churchId, pulpitoId, viernes, viernes);
        const materializada = despues.days[0]?.meetings.find((one) => one.id !== null);
        expect(materializada?.name).toBe('Alabanza'); // lo que había, no el patrón nuevo

        // El viernes siguiente — todavía propuesta — sí lleva el patrón nuevo.
        const siguiente = new Date(
            new Date(`${viernes}T12:00:00Z`).getTime() + 7 * 24 * 60 * 60 * 1000,
        )
            .toISOString()
            .slice(0, 10);
        const propuesta = (await calendarRange(churchId, pulpitoId, siguiente, siguiente)).days[0]
            ?.meetings[0];
        expect(propuesta?.name).toBe('Culto nuevo');
    });

    it('los avisos salen de lo materializado: hueco y repetido, no propuestas', async () => {
        const { viernes } = semanaDesde(28);
        const { viernes: otroViernes } = semanaDesde(35);
        const from = new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const to = new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        const juan = addBeliever('Luis', 'Fernández');
        const patternId = (await calendarRange(churchId, pulpitoId, viernes, viernes)).days[0]
            ?.meetings[0]?.patternId!;
        await assignSlot(churchId, { date: viernes, patternId, position: 0, believerIds: [juan] });

        const summary = await calendarSummary(churchId, pulpitoId, from, to);
        expect(summary.people.some((one) => one.believerId === juan)).toBe(true);
        // El viernes materializado queda con fases vacías: el aviso que hoy se
        // pierde en el Excel.
        expect(
            summary.warnings.some((one) => one.kind === 'unassigned' && one.date === viernes),
        ).toBe(true);
        // Las semanas que nadie tocó no generan avisos: solo hay huecos donde hay
        // reunión de verdad.
        expect(summary.warnings.some((one) => one.date === otroViernes)).toBe(false);
    });

    it('una fase admite a varias personas en el orden elegido; reasignar reemplaza el conjunto y vaciar la deja libre', async () => {
        const { viernes } = semanaDesde(84);
        const ana = addBeliever('Ana', 'Varias');
        const pedro = addBeliever('Pedro', 'Varias');
        const patternId = (await calendarRange(churchId, pulpitoId, viernes, viernes)).days[0]
            ?.meetings[0]?.patternId!;
        const nombres = async (): Promise<string[]> =>
            (
                (await calendarRange(churchId, pulpitoId, viernes, viernes)).days[0]?.meetings[0]
                    ?.slots[0]?.believers ?? []
            ).map((one) => one.name);

        await assignSlot(churchId, {
            date: viernes,
            patternId,
            position: 0,
            believerIds: [pedro, ana],
        });
        expect(await nombres()).toEqual(['Pedro Varias', 'Ana Varias']);

        await assignSlot(churchId, { date: viernes, patternId, position: 0, believerIds: [ana] });
        expect(await nombres()).toEqual(['Ana Varias']);

        // Cada persona de la fase cuenta como una subida suya en el reparto.
        await assignSlot(churchId, {
            date: viernes,
            patternId,
            position: 0,
            believerIds: [ana, pedro],
        });
        const from = new Date(Date.now() + 83 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const to = new Date(Date.now() + 91 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const summary = await calendarSummary(churchId, pulpitoId, from, to);
        expect(summary.people.find((one) => one.believerId === pedro)?.times).toBe(1);
        expect(summary.people.find((one) => one.believerId === ana)?.times).toBe(1);

        await assignSlot(churchId, { date: viernes, patternId, position: 0, believerIds: [] });
        expect(await nombres()).toEqual([]);
    });

    it('el buscador del selector quita acentos (Regla 1)', () => {
        expect(toSearchName('Jesús')).toBe(toSearchName('jesus'));
    });

    it('el selector de personas devuelve candidatos con su reparto, paginado (regresión: ligar mal los parámetros vaciaba o reventaba la consulta)', async () => {
        const { viernes } = semanaDesde(56);
        const from = new Date(Date.now() + 55 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const to = new Date(Date.now() + 63 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        const ana = addBeliever('Ana', 'Preacher');
        const patternId = (await calendarRange(churchId, pulpitoId, viernes, viernes)).days[0]
            ?.meetings[0]?.patternId!;
        await assignSlot(churchId, { date: viernes, patternId, position: 0, believerIds: [ana] });

        const primera = await listPreachers(churchId, {
            calendarId: pulpitoId,
            ministry: null,
            all: true,
            from,
            to,
            page: 1,
            limit: 1,
        });
        expect(primera.items).toHaveLength(1);
        expect(primera.total).toBeGreaterThan(1); // Ana y el resto de la iglesia.
        expect(primera.totalPages).toBeGreaterThan(1);

        const segunda = await listPreachers(churchId, {
            calendarId: pulpitoId,
            ministry: null,
            all: true,
            from,
            to,
            page: 2,
            limit: 1,
        });
        expect(segunda.items[0]?.id).not.toBe(primera.items[0]?.id);

        const conAna = await listPreachers(churchId, {
            calendarId: pulpitoId,
            ministry: null,
            all: true,
            q: toSearchName('Ana'),
            from,
            to,
            page: 1,
            limit: 25,
        });
        const encontrada = conAna.items.find((one) => one.id === ana);
        expect(encontrada?.timesInRange).toBe(1);
        expect(encontrada?.lastDate).toBe(viernes);
    });

    it('nunca la última sede ni el último calendario', async () => {
        const sede = (await listCongregations(churchId))[0];
        await expect(deleteCongregation(churchId, sede.id)).rejects.toThrow('la última sede');

        // Se borran todos menos uno — este test corre tras haber creado otros —
        // y el último que queda se resiste.
        let calendars = await listCalendars(churchId);
        while (calendars.length > 1) {
            await expect(deleteCalendar(churchId, calendars[0].id)).resolves.toBeUndefined();
            calendars = await listCalendars(churchId);
        }
        await expect(deleteCalendar(churchId, calendars[0].id)).rejects.toThrow('único calendario');

        // Con una segunda sede y un segundo calendario, borrar sí vale.
        const segunda = await createCongregation(churchId, { name: 'Alicante' });
        await expect(deleteCongregation(churchId, segunda.id)).resolves.toBeUndefined();
        await createCalendar(churchId, { name: 'Vigilancia', ministry: 'vigilancia' });
        const conDos = await listCalendars(churchId);
        const extra = conDos.find((one) => one.name === 'Vigilancia')!;
        await expect(deleteCalendar(churchId, extra.id)).resolves.toBeUndefined();
    });

    it('una reunión puntual nace con sus fases, y cancelarla la quita sin borrarla', async () => {
        const { viernes } = semanaDesde(49);
        const sede = (await listCongregations(churchId)).find((one) => one.name === 'Elda')!;

        await createMeeting(churchId, pulpitoId, {
            congregationId: sede.id,
            date: viernes,
            startTime: '21:00',
            name: 'Oración',
            phases: [{ name: 'Introducción' }, { name: 'Cierre' }],
        });

        const rango = await calendarRange(churchId, pulpitoId, viernes, viernes);
        const puntual = rango.days[0]?.meetings.find((one) => one.name === 'Oración');
        expect(puntual?.slots).toHaveLength(2);
        expect(puntual?.startTime).toBe('21:00');

        await updateMeeting(churchId, { id: puntual!.id!, status: 'cancelada' });
        const cancelada = (
            await calendarRange(churchId, pulpitoId, viernes, viernes)
        ).days[0]?.meetings.find((one) => one.id === puntual?.id);
        expect(cancelada?.status).toBe('cancelada');
    });
});
