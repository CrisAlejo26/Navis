import { addDays, type IsoDate } from '@navis/shared';

import { todayIso } from './repos/dashboard-repo';
import { createProphecy } from './repos/prophecies-repo';
import { addFulfillment } from './repos/prophecy-fulfillments-repo';
import { getDb } from './db';

/**
 * Profecías de **prueba**, con todos los estados que pinta la portada: por
 * cumplir (recientes y antiguas), cumplidas a medias con su historial,
 * cumplidas del todo y una con un cuerpo largo para ver cómo se trunca.
 * Las fechas son relativas a hoy, así que nunca caducan.
 */

interface DemoProphecy {
    title: string;
    body: string;
    daysAgo: number;
    /** Día en que se dio por cumplida del todo, en días desde hoy hacia atrás. */
    fulfilledDaysAgo?: number;
    /** Cumplimientos parciales: texto y días desde hoy hacia atrás. */
    fulfillments?: { text: string; daysAgo: number }[];
}

const PROFECIAS: DemoProphecy[] = [
    {
        title: 'Una puerta se abrirá en el norte',
        body: 'Durante la oración de la madrugada sentí que el Señor decía: «Una puerta que lleva años cerrada se abrirá en el norte, y no la abrirá nadie más que yo». Lo anoté sin entenderlo.',
        daysAgo: 6,
    },
    {
        title: 'Tiempo de siembra para la familia',
        body: 'Una palabra para casa: este año es de sembrar con paciencia, no de cosechar. Lo que se hable en la mesa dará fruto más adelante.',
        daysAgo: 21,
        fulfillments: [{ text: 'Mi hijo pidió que orásemos juntos antes de cenar.', daysAgo: 8 }],
    },
    {
        title: 'Sanidad en las rodillas de la hermana Carmen',
        body: 'En la reunión del jueves, mientras orábamos por ella, vi que se levantaba sin apoyarse. Se lo dije al final del culto y quedó en silencio.',
        daysAgo: 75,
        fulfillments: [
            { text: 'Esta semana subió las escaleras del local sin el bastón.', daysAgo: 40 },
            { text: 'Caminó desde su casa hasta el culto, unos veinte minutos.', daysAgo: 18 },
            { text: 'El médico le quitó la medicación para el dolor.', daysAgo: 3 },
        ],
    },
    {
        title: 'El trabajo de Javier',
        body: 'Mientras leía el Salmo 37 tuve la certeza de que a Javier le llegaría una oferta antes de acabar el verano, en un lugar que no esperaba.',
        daysAgo: 130,
        fulfilledDaysAgo: 52,
        fulfillments: [{ text: 'Le llamaron de una empresa de Alicante.', daysAgo: 70 }],
    },
    {
        title: 'Un nuevo hermano llegará con su esposa',
        body: 'Vi a un matrimonio entrando por la puerta de recepción un domingo, y a ella llorando antes de que empezara la alabanza.',
        daysAgo: 210,
        fulfilledDaysAgo: 160,
    },
    {
        title: 'Dejar de mirar atrás',
        body: 'Una palabra personal, sin más. Me costó escribirla porque habla de una decisión que todavía no he tomado y que llevo meses posponiendo.',
        daysAgo: 320,
    },
    {
        title: 'Agua en el desierto para la obra de Benidorm',
        body: [
            'Esta palabra llegó en tres partes, a lo largo de una misma semana, y la anoto entera para no perder ninguna.',
            'Primero, una imagen: un pozo seco junto a un camino de tierra y un grupo de personas sentadas alrededor, esperando sin quejarse.',
            'Después, una frase: «No os canséis de esperar, que el agua ya viene por debajo».',
            'Por último, la fecha: el primer viernes del año, cuando empiecen las reuniones en la nueva sede. Lo compartí con los ancianos y acordamos volver a hablarlo en seis meses.',
        ].join('\n\n'),
        daysAgo: 95,
        fulfillments: [{ text: 'Se firmó el alquiler del local de Benidorm.', daysAgo: 30 }],
    },
];

/** Crea las profecías de prueba de ese usuario. No hace nada si ya tiene alguna. */
export async function seedDemoProphecies(ownerId: string): Promise<void> {
    const db = await getDb();
    const existing = await db.getFirstAsync<{ total: number }>(
        'SELECT COUNT(*) AS total FROM prophecies WHERE owner_id = ? AND deleted_at IS NULL',
        ownerId,
    );
    if ((existing?.total ?? 0) > 0) return;

    const today: IsoDate = todayIso();
    for (const item of PROFECIAS) {
        const id = await createProphecy(ownerId, {
            title: item.title,
            body: item.body,
            receivedAt: addDays(today, -item.daysAgo),
            fulfilledAt:
                item.fulfilledDaysAgo === undefined
                    ? undefined
                    : addDays(today, -item.fulfilledDaysAgo),
        });
        for (const one of item.fulfillments ?? []) {
            await addFulfillment(ownerId, id, {
                text: one.text,
                occurredAt: addDays(today, -one.daysAgo),
            });
        }
    }
}
