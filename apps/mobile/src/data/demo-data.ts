import {
    addDays,
    addMonths,
    eachDay,
    endOfMonth,
    startOfMonth,
    weekdayOf,
    type NoteKind,
} from '@navis/shared';

import { getDb, nowIso } from './db';
import { createAccount, login } from './repos/account-repo';
import { createChurch, findChurchByOwner } from './repos/church-repo';
import { createBeliever, listBelievers, updateBeliever } from './repos/believers-repo';
import { createNote } from './repos/notes-repo';
import { createCatalogEntry } from './repos/catalog-repo';
import { listCalendars, createCongregation, listCongregations } from './repos/calendar-repo';
import { listPatterns } from './repos/calendar-settings';
import { assignSlot } from './repos/calendar-assignments';

/**
 * Datos de **prueba** para ver la aplicación llena (Regla 11): una iglesia,
 * veinte hermanos —los primeros con la ficha completa y los últimos con
 * campos que faltan, para que se vea tanto el listado lleno como las fichas
 * cojas—, notas de varios tipos y etiquetas propias.
 *
 * Se siembra una sola vez: si ya hay creyentes en la base, no toca nada. El
 * botón vive en Ajustes y desaparece cuando ya hay datos.
 */

const HERMANOS: {
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    status: 'activo' | 'nuevo' | 'inactivo' | 'trasladado';
    /** Días desde la última nota: el color de la sonda sale de aquí. */
    daysAgo: number | null;
    alertAfterDays: number | null;
    ministries: string[];
    /** Índices de etiquetas del catálogo creado más abajo. */
    tags: number[];
}[] = [
    {
        firstName: 'Juan Carlos',
        lastName: 'Ruiz',
        phone: '+34 600 111 222',
        email: 'juancarlos@example.com',
        status: 'activo',
        daysAgo: 7,
        alertAfterDays: 30,
        ministries: ['pulpito'],
        tags: [0],
    },
    {
        firstName: 'María',
        lastName: 'Fernández',
        phone: '+34 600 333 444',
        email: 'maria@example.com',
        status: 'activo',
        daysAgo: 34,
        alertAfterDays: 30,
        ministries: ['sonido'],
        tags: [1],
    },
    {
        firstName: 'Andrés',
        lastName: 'Molina',
        phone: '+34 600 555 666',
        email: 'andres@example.com',
        status: 'nuevo',
        daysAgo: null,
        alertAfterDays: 20,
        ministries: [],
        tags: [],
    },
    {
        firstName: 'Laura',
        lastName: 'Gómez',
        phone: '+34 600 777 888',
        email: 'laura@example.com',
        status: 'activo',
        daysAgo: 3,
        alertAfterDays: 30,
        ministries: ['recepcion', 'microfono'],
        tags: [0, 2],
    },
    {
        firstName: 'Pedro',
        lastName: 'Sánchez',
        phone: '+34 600 999 000',
        email: 'pedro@example.com',
        status: 'activo',
        daysAgo: 15,
        alertAfterDays: 30,
        ministries: ['biblias'],
        tags: [],
    },
    {
        firstName: 'Sofía',
        lastName: 'Ramírez',
        phone: '+34 601 222 333',
        email: 'sofia@example.com',
        status: 'nuevo',
        daysAgo: 2,
        alertAfterDays: 30,
        ministries: [],
        tags: [2],
    },
    {
        firstName: 'Diego',
        lastName: 'Torres',
        phone: '+34 601 444 555',
        email: 'diego@example.com',
        status: 'inactivo',
        daysAgo: 90,
        alertAfterDays: null,
        ministries: [],
        tags: [],
    },
    {
        firstName: 'Carmen',
        lastName: 'Ortega',
        phone: '+34 601 666 777',
        email: 'carmen@example.com',
        status: 'activo',
        daysAgo: 25,
        alertAfterDays: 20,
        ministries: ['ofrenda'],
        tags: [1],
    },
    {
        firstName: 'Miguel',
        lastName: 'Ángel',
        phone: '+34 601 888 999',
        email: 'miguel@example.com',
        status: 'activo',
        daysAgo: 45,
        alertAfterDays: 30,
        ministries: ['pulpito', 'sonido'],
        tags: [],
    },
    {
        firstName: 'Lucía',
        lastName: 'Navarro',
        phone: '+34 602 123 456',
        email: 'lucia@example.com',
        status: 'trasladado',
        daysAgo: 200,
        alertAfterDays: null,
        ministries: [],
        tags: [],
    },
    {
        firstName: 'Javier',
        lastName: 'Iglesias',
        phone: '+34 602 234 567',
        email: 'javier@example.com',
        status: 'activo',
        daysAgo: 0,
        alertAfterDays: 30,
        ministries: ['vigilancia'],
        tags: [0],
    },
    {
        firstName: 'Elena',
        lastName: 'Castro',
        phone: '+34 602 345 678',
        email: 'elena@example.com',
        status: 'nuevo',
        daysAgo: null,
        alertAfterDays: 30,
        ministries: [],
        tags: [],
    },
    {
        firstName: 'Gabriel',
        lastName: 'Herrera',
        phone: '+34 602 456 789',
        email: 'gabriel@example.com',
        status: 'activo',
        daysAgo: 10,
        alertAfterDays: 30,
        ministries: ['microfono'],
        tags: [2],
    },
    {
        firstName: 'Rocío',
        lastName: 'Vargas',
        phone: null,
        email: 'rocio@example.com',
        status: 'activo',
        daysAgo: 18,
        alertAfterDays: 30,
        ministries: ['ofrenda'],
        tags: [],
    },
    {
        firstName: 'Tomás',
        lastName: 'Ibarra',
        phone: '+34 602 567 890',
        email: null,
        status: 'nuevo',
        daysAgo: 5,
        alertAfterDays: 20,
        ministries: [],
        tags: [1],
    },
    {
        firstName: 'Valeria',
        lastName: 'Serrano',
        phone: null,
        email: null,
        status: 'activo',
        daysAgo: 40,
        alertAfterDays: 30,
        ministries: ['biblias'],
        tags: [],
    },
    {
        firstName: 'Nicolás',
        lastName: 'Fuentes',
        phone: '+34 602 678 901',
        email: 'nicolas@example.com',
        status: 'activo',
        daysAgo: 60,
        alertAfterDays: null,
        ministries: [],
        tags: [],
    },
    {
        firstName: 'Alicia',
        lastName: 'Campos',
        phone: null,
        email: 'alicia@example.com',
        status: 'inactivo',
        daysAgo: 120,
        alertAfterDays: null,
        ministries: [],
        tags: [],
    },
    {
        firstName: 'Samuel',
        lastName: 'Peña',
        phone: null,
        email: null,
        status: 'nuevo',
        daysAgo: null,
        alertAfterDays: null,
        ministries: [],
        tags: [],
    },
    {
        firstName: 'Daniela',
        lastName: 'Lozano',
        phone: '+34 602 789 012',
        email: 'daniela@example.com',
        status: 'activo',
        daysAgo: 1,
        alertAfterDays: 30,
        ministries: ['recepcion', 'vigilancia'],
        tags: [0, 2],
    },
];

const NOTAS: { kind: NoteKind; told: string; advice: string | null }[] = [
    {
        kind: 'seguimiento',
        told: 'Contó que llevaba dos años sin hablar con su hermano y que esta semana le llamó. Estaba nervioso y salió contento.',
        advice: 'Que le llame de nuevo el domingo',
    },
    {
        kind: 'testimonio',
        told: 'Compartió en la reunión cómo encontró trabajo después de tres meses buscándolo.',
        advice: null,
    },
    {
        kind: 'sueno',
        told: 'Soñó que caminaba por un río turbio y que una mano lo sacaba a la orilla.',
        advice: 'Anotar el sueño en su ficha de sueños',
    },
    {
        kind: 'don',
        told: 'Recibió el don durante la oración del martes. Lo manifestó por primera vez.',
        advice: null,
    },
    {
        kind: 'vision',
        told: 'Vio la sala llena de luz durante el culto y sintió que debía pedir la paz por su familia.',
        advice: 'Seguimiento el viernes',
    },
    {
        kind: 'experiencia',
        told: 'Volvió del retiro muy motivado; pidió servir en la recepción.',
        advice: 'Presentarlo al equipo',
    },
    {
        kind: 'correccion',
        told: 'Llegó tarde a su turno de sonido por segunda vez. Se habló con él en privado.',
        advice: 'Revisar el horario del mes que viene',
    },
];

/**
 * Siembra los datos **en la iglesia que se le pasa**, si esa iglesia está
 * vacía de creyentes. Devuelve `true` si ha sembrado algo.
 *
 * La comprobación es **por iglesia** y no global: sembrar en la de la sesión
 * activa tiene que funcionar aunque otra iglesia del teléfono ya tenga
 * creyentes — si mirara la base entera, el botón se saltaría la siembra y el
 * listado se quedaría vacío sin decir por qué.
 */
export async function seedDemoData(churchId: string, userId: string): Promise<boolean> {
    const db = await getDb();
    const existing = await db.getFirstAsync<{ total: number }>(
        'SELECT COUNT(*) AS total FROM believers WHERE church_id = ? AND deleted_at IS NULL',
        churchId,
    );
    if ((existing?.total ?? 0) > 0) return false;

    // Etiquetas propias para verlas con su color en fichas y listado. Si ya
    // existieran de un intento anterior, el repo lanza «duplicate» y se ignora.
    const TAG_NAMES = ['Voluntario', 'En busca de trabajo', 'Nueva creencia'];
    for (const name of TAG_NAMES) {
        try {
            await createCatalogEntry('tags', churchId, { name });
        } catch {
            // Ya estaban: la siembra es idempotente a propósito.
        }
    }

    const believers: string[] = [];
    for (const person of HERMANOS) {
        const id = await createBeliever(churchId, {
            firstName: person.firstName,
            lastName: person.lastName,
            phone: person.phone,
            email: person.email,
            status: person.status,
            alertAfterDays: person.alertAfterDays,
            ministries: person.ministries,
        });
        // El alta de hoy no puede llevar notas de hace semanas: el margen se
        // cuenta desde el alta, así que a quien no tiene notas no se le toca.
        if (person.daysAgo !== null) {
            const createdAt = new Date(
                Date.now() - (person.daysAgo + 30) * 24 * 60 * 60 * 1000,
            ).toISOString();
            await db.runAsync('UPDATE believers SET created_at = ? WHERE id = ?', createdAt, id);
        }
        believers.push(id);
    }

    // Las etiquetas van después de crear el catálogo, por índice.
    const tagRows = await db.getAllAsync<{ id: string }>(
        'SELECT id FROM believer_tags WHERE church_id = ? AND deleted_at IS NULL ORDER BY position ASC',
        churchId,
    );
    const tags = tagRows.map((row) => row.id);
    for (const [index, person] of HERMANOS.entries()) {
        if (person.tags.length === 0) continue;
        const ids = person.tags
            .map((position) => tags[position])
            .filter((one): one is string => Boolean(one));
        const believerId = believers[index];
        if (ids.length > 0 && believerId) {
            await updateBeliever(believerId, churchId, {
                tagIds: ids,
                featuredTagId: ids[0] ?? null,
            });
        }
    }

    // Notas: las tres primeras personas llevan historial; la última nota de
    // cada una queda a los `daysAgo` días de hoy, para que la sonda cuadre.
    for (const [index, person] of HERMANOS.entries()) {
        if (person.daysAgo === null) continue;
        const believerId = believers[index];
        if (!believerId) continue;
        const howMany = Math.min(2 + (index % 3), NOTAS.length);
        for (let noteIndex = 0; noteIndex < howMany; noteIndex++) {
            const note = NOTAS[(index + noteIndex) % NOTAS.length];
            if (!note) continue;
            const offset =
                noteIndex === 0 ? person.daysAgo : person.daysAgo + 14 * (howMany - noteIndex);
            const occurredAt = addDays(nowIso().slice(0, 10), -offset);
            await createNote(believerId, churchId, userId, {
                kind: note.kind,
                occurredAt,
                told: note.told,
                advice: note.advice,
            });
        }
    }

    // Calendario: reuniones materializadas con asignaciones repartidas en los
    // cuatro calendarios de serie y en dos sedes —viernes en Benidorm, el resto
    // en la principal—, con fases sin asignar a propósito para ver la línea de
    // puntos que pide que la rellenen (RFC 0002 §8.1).
    try {
        await createCongregation(churchId, { name: 'Benidorm', accent: '#0891b2' });
    } catch {
        // Ya estaba: la siembra es idempotente.
    }
    const calendarios = await listCalendars(churchId);
    const sedes = await listCongregations(churchId);
    const candidatos = (await listBelievers({ churchId, limit: 100 })).items;
    const hoy = nowIso().slice(0, 10);
    const dias = eachDay(startOfMonth(hoy), endOfMonth(addMonths(startOfMonth(hoy), 2)));

    for (const calendario of calendarios) {
        const labor = calendario.ministry;
        const enLabor = candidatos.filter((one) =>
            labor ? (one.ministries ?? []).includes(labor) : true,
        );
        if (enLabor.length === 0) continue;
        const patrones = await listPatterns(calendario.id);
        let turno = 0;

        for (const day of dias) {
            // El viernes cae en la segunda sede, si la hay: el día con dos cintas.
            const weekday = weekdayOf(day);
            const sede = weekday === 5 ? (sedes[1] ?? sedes[0]) : sedes[0];
            if (!sede) continue;
            const patron = (await listPatterns(calendario.id)).find(
                (one) => one.weekday === weekday && one.congregationId === sede.id && one.isActive,
            );
            if (!patron) continue;

            // La primera fase lleva a quien le toca; el resto, hueco o persona
            // rotando — nunca todo lleno, que es como se ve un mes real.
            for (const [position, fase] of patron.phases.entries()) {
                const asignar = position === 0 || (position === 1 && turno % 3 === 0);
                if (!asignar) continue;
                const persona = enLabor[turno % enLabor.length];
                if (!persona) continue;
                await assignSlot(churchId, {
                    date: day,
                    patternId: patron.id,
                    position,
                    believerIds: [persona.id],
                });
                turno += 1;
            }
        }
    }

    return true;
}

/** Cuántos creyentes hay **en esa iglesia**: para saber si el botón aún sirve. */
export async function hasDemoData(churchId: string): Promise<boolean> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ total: number }>(
        'SELECT COUNT(*) AS total FROM believers WHERE church_id = ? AND deleted_at IS NULL',
        churchId,
    );
    return (row?.total ?? 0) > 0;
}

const DEMO_EMAIL = 'demo@navis.app';
const DEMO_PASSWORD = 'navis-demo-1234';
const DEMO_CHURCH_NAME = 'Iglesia Navis Demo';

/**
 * La entrada directa de demostración (Regla 11): cuenta —creada o ya
 * existente—, **su** iglesia demo y los datos sembrados en ella, en una sola
 * llamada. La sesión que devuelve apunta exactamente a la iglesia donde
 * acaban de caer los datos, sin depender de cuál fuera la primera del dueño.
 *
 * Va bajo **una promesa compartida**: la siembra automática del arranque y el
 * botón de la bienvenida pueden cruzarse, y dos `prepareDemoSession` a la vez
 * se pisan en el alta de la cuenta — que solo uno corra es lo que hace que el
 * segundo reciba lo sembrado en vez de un choque de claves únicas.
 */
let demoSession: Promise<{ userId: string; churchId: string }> | null = null;

export function prepareDemoSession(): Promise<{ userId: string; churchId: string }> {
    demoSession ??= (async () => {
        const created = await createAccount({
            name: 'Demo Navis',
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
        });
        const user =
            'error' in created
                ? await (async () => {
                      const logged = await login({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
                      if ('error' in logged) throw new Error('La cuenta demo existe pero no entra');
                      return logged.user;
                  })()
                : created.user;

        // La iglesia demo del dueño, o una nueva si no tiene ninguna. La primera
        // por fecha de creación vale: este usuario solo tiene (o solo quiere) esta.
        const church =
            (await findChurchByOwner(user.id)) ??
            (await createChurch({ name: DEMO_CHURCH_NAME, city: 'Elda', ownerId: user.id }));

        await seedDemoData(church.id, user.id);
        return { userId: user.id, churchId: church.id };
    })();
    return demoSession;
}

/**
 * El usuario de prueba, **sembrado solo al arrancar** (como el
 * `initializeTestUser` de Dreamkeeper): cuenta `demo@navis.app` /
 * `navis-demo-1234`, su iglesia y los veinte registros con todo y a faltas,
 * listos para entrar por el login de siempre sin pulsar nada.
 *
 * Idempotente —si la cuenta ya existe, no toca nada— y **silencioso**: es un
 * usuario de prueba; si la siembra falla o choca con otra en marcha, ni se
 * avisa ni se lanza — el arranque de la app no se entera de que hubo demo.
 */
export async function initializeTestUser(): Promise<void> {
    try {
        const db = await getDb();
        const existing = await db.getFirstAsync<{ id: string }>(
            'SELECT id FROM local_user WHERE email = ?',
            DEMO_EMAIL,
        );
        if (existing) return;
        await prepareDemoSession();
    } catch {
        // En silencio: que la demo fallida no tape el arranque de verdad.
    }
}
