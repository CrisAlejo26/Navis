// Primero el soporte: registra los mocks de expo-crypto/expo-secure-store
// antes de que carguen los módulos que los usan.
import { setupLocalDb } from '@/data/test-support';
import { DEFAULT_WEEK, SEEDED_CALENDARS, defaultWeekFor } from '@navis/shared';
import { setDbForTests } from '@/data/db';
import { createChurch } from '@/data/repos/church-repo';
import { createCongregation } from '@/data/repos/calendar-repo';
import { seedCalendarScaffold } from '@/data/repos/calendar-seed';
import { openDatabaseAsync } from 'expo-sqlite';

jest.mock('expo-sqlite', () => ({
    __esModule: true,
    openDatabaseAsync: jest.fn(),
}));

/**
 * La siembra del andamiaje de calendario (paso 1 del plan móvil): una iglesia
 * nueva nace con los cuatro calendarios de serie (RFC 0002 D15) y la semana
 * por defecto de cada calendario en cada sede (§5.7), y sembrar dos veces —
 * migración 4 sobre lo ya sembrado, o dos iglesias seguidas— no duplica nada.
 */
describe('el andamiaje del calendario', () => {
    let db: Awaited<ReturnType<typeof setupLocalDb>>;
    let churchId: string;

    beforeAll(async () => {
        db = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
        const church = await createChurch({ name: 'Iglesia del Sur', city: 'Elda', ownerId: 'u1' });
        churchId = church.id;
    });

    afterAll(() => {
        db.close();
    });

    it('la iglesia nueva nace con los cuatro calendarios de serie', async () => {
        const calendars = await db.adapter.getAllAsync<{
            name: string;
            slug: string;
            ministry: string | null;
            position: number;
        }>(
            'SELECT name, slug, ministry, position FROM calendars WHERE church_id = ? AND deleted_at IS NULL ORDER BY position ASC',
            churchId,
        );
        expect(calendars).toHaveLength(SEEDED_CALENDARS.length);
        expect(calendars.map((one) => one.slug)).toEqual(SEEDED_CALENDARS.map((one) => one.slug));
        expect(calendars[0]?.ministry).toBe('pulpito');
    });

    it('cada calendario lleva la semana de su ministerio en la sede', async () => {
        const pulpito = await db.adapter.getFirstAsync<{ id: string }>(
            'SELECT id FROM calendars WHERE church_id = ? AND slug = ?',
            churchId,
            'pulpito',
        );
        const patterns = await db.adapter.getAllAsync<{ name: string; weekday: number }>(
            'SELECT name, weekday FROM meeting_patterns WHERE calendar_id = ? AND deleted_at IS NULL ORDER BY weekday ASC',
            pulpito?.id ?? '',
        );
        expect(patterns).toHaveLength(DEFAULT_WEEK.length);
        // Con fases, copiadas en su orden — es lo que materializará la reunión.
        const phases = await db.adapter.getAllAsync<{ name: string }>(
            'SELECT pp.name AS name FROM pattern_phases pp JOIN meeting_patterns mp ON mp.id = pp.pattern_id WHERE mp.calendar_id = ? AND mp.weekday = ? AND mp.deleted_at IS NULL ORDER BY pp.position ASC',
            pulpito?.id ?? '',
            5, // viernes: alabanza, con «Introducción, Final, Encargado, Abre iglesia»
        );
        expect(phases.map((one) => one.name)).toEqual(DEFAULT_WEEK[5]?.phases);
    });

    it('sembrar otra vez — la migración 4 sobre lo ya sembrado — no duplica nada', async () => {
        // Lo que hace la migración 4 al encontrar una base con la siembra hecha.
        await seedCalendarScaffold(db.adapter, churchId, new Date().toISOString());

        const calendars = await db.adapter.getAllAsync<{ total: number }>(
            'SELECT COUNT(*) AS total FROM calendars WHERE church_id = ? AND deleted_at IS NULL',
            churchId,
        );
        expect(calendars[0]?.total).toBe(SEEDED_CALENDARS.length);
    });

    it('una sede nueva recibe la semana en todos los calendarios, sin pisar lo que ya había', async () => {
        const before = await db.adapter.getFirstAsync<{ total: number }>(
            'SELECT COUNT(*) AS total FROM meeting_patterns',
        );
        const sede = await createCongregation(churchId, { name: 'Benidorm' });
        const after = await db.adapter.getFirstAsync<{ total: number }>(
            'SELECT COUNT(*) AS total FROM meeting_patterns',
        );

        // Lo que toca sembrar: una semana por calendario — siete patrones de
        // púlpito, recepción, sonido y biblias; y nada más (lo que ya había, sin
        // tocar).
        const esperado = SEEDED_CALENDARS.reduce(
            (total, one) => total + defaultWeekFor(one.ministry).length,
            0,
        );
        expect((after?.total ?? 0) - (before?.total ?? 0)).toBe(esperado);
        const deLaNueva = await db.adapter.getFirstAsync<{ total: number }>(
            'SELECT COUNT(*) AS total FROM meeting_patterns WHERE congregation_id = ?',
            sede.id,
        );
        expect(deLaNueva?.total).toBe(esperado);
    });
});
