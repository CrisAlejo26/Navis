import { addDays, type IsoDate } from '@navis/shared';

import { getDb } from './db';
import { todayIso } from './repos/dashboard-repo';
import { listEmotions } from './repos/emotions-repo';
import { createDream, updateDream } from './repos/dreams-writes';

/**
 * Sueños de **prueba**: con y sin título, con una o varias emociones, con
 * interpretación y sin ella, abiertos y cumplidos (con lo que significó), y uno
 * largo para ver cómo se trunca. Las emociones son las de serie, por su slug.
 */

interface DemoDream {
    title?: string;
    body: string;
    daysAgo: number;
    emotions: string[];
    interpretation?: string;
    fulfilled?: { daysAgo: number; meaning: string };
}

const SUENOS: DemoDream[] = [
    {
        title: 'El río turbio',
        body: 'Caminaba por la orilla de un río de agua marrón y de pronto resbalaba. Una mano salía de entre las cañas y me agarraba de la muñeca hasta dejarme en la hierba.',
        daysAgo: 3,
        emotions: ['miedo', 'paz'],
    },
    {
        body: 'Estaba en la casa de mi infancia y todas las puertas daban a una sala llena de luz. No recuerdo nada más, solo que no quería irme.',
        daysAgo: 9,
        emotions: ['tranquilidad'],
    },
    {
        title: 'Corría sin llegar',
        body: 'Corría por un pasillo largo hacia una puerta que no se acercaba. Alguien detrás de mí decía mi nombre, pero no me giraba.',
        daysAgo: 20,
        emotions: ['ansiedad', 'persecucion'],
        interpretation:
            'Puede hablar de la decisión que llevo posponiendo: lo que me persigue no es una amenaza, es una llamada.',
    },
    {
        title: 'La mesa larga',
        body: 'Había una mesa enorme en un prado, con gente que conozco y otra que no. Todos partían el pan y nadie tenía prisa.',
        daysAgo: 48,
        emotions: ['alegria', 'esperanza', 'libertad'],
        interpretation:
            'Una imagen de la iglesia reunida; lo que más me marcó fue la falta de prisa.',
    },
    {
        title: 'El barco sin timón',
        body: 'Iba en una barca pequeña sin remos ni timón, y aun así avanzaba hacia un faro que se veía muy lejos. El mar estaba en calma.',
        daysAgo: 85,
        emotions: ['confusion', 'esperanza'],
        interpretation:
            'Dejarme llevar sin perder el rumbo: el faro es lo que orienta, no mi esfuerzo.',
        fulfilled: {
            daysAgo: 25,
            meaning:
                'Al cerrar el año tuve que dejar un proyecto que sostenía yo solo y, sin saber cómo, todo quedó en manos de otros que lo llevaron mejor.',
        },
    },
    {
        title: 'La carta de mi abuela',
        body: 'Mi abuela me daba una carta cerrada y me pedía que no la abriera hasta «el día de la fiesta». Yo la guardaba en el bolsillo del abrigo.',
        daysAgo: 140,
        emotions: ['tristeza', 'curiosidad'],
        fulfilled: {
            daysAgo: 60,
            meaning:
                'Mi hermano anunció su boda y, al abrir el cajón de mi abuela, encontré una carta para él.',
        },
    },
    {
        body: [
            'Empezaba en un mercado lleno de gente. Yo buscaba a alguien y no sabía a quién. Pasaba por puestos de fruta, de telas y de libros, y en cada uno me decían que «ya había pasado por aquí».',
            'Al final del mercado había una escalera de piedra que bajaba hasta un patio pequeño, con un pozo en el centro. Allí estaba mi padre, joven, sacando agua con un cubo de madera.',
            'Me daba de beber sin decir nada. El agua estaba fría y sabía a algo que no sé nombrar. Me desperté con esa sed y esa calma a la vez.',
        ].join('\n\n'),
        daysAgo: 200,
        emotions: ['paz', 'tristeza', 'felicidad'],
    },
];

/** Crea los sueños de prueba de ese usuario. No hace nada si ya tiene alguno. */
export async function seedDemoDreams(ownerId: string): Promise<void> {
    const db = await getDb();
    const existing = await db.getFirstAsync<{ total: number }>(
        'SELECT COUNT(*) AS total FROM dreams WHERE owner_id = ? AND deleted_at IS NULL',
        ownerId,
    );
    if ((existing?.total ?? 0) > 0) return;

    const bySlug = new Map(
        (await listEmotions(ownerId)).flatMap((one) =>
            one.slug ? [[one.slug, one.id] as const] : [],
        ),
    );
    const today: IsoDate = todayIso();

    for (const item of SUENOS) {
        const id = await createDream(ownerId, {
            title: item.title,
            body: item.body,
            dreamedAt: addDays(today, -item.daysAgo),
            interpretation: item.interpretation ?? null,
            emotionIds: item.emotions
                .map((slug) => bySlug.get(slug))
                .filter((emotionId): emotionId is string => emotionId !== undefined),
        });
        if (item.fulfilled) {
            await updateDream(ownerId, id, {
                fulfilledAt: addDays(today, -item.fulfilled.daysAgo),
                fulfillmentMeaning: item.fulfilled.meaning,
            });
        }
    }
}
