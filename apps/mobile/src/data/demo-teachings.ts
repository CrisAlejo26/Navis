import {
    addDays,
    type CreateTeachingInput,
    type IsoDate,
    type TeachingBlock,
    type TeachingListItemNode,
    type TeachingTextNode,
} from '@navis/shared';

import { getDb } from './db';
import { todayIso } from './repos/dashboard-repo';
import { createTeaching } from './repos/teachings-repo';

/**
 * Enseñanzas de **prueba**: párrafos con negrita y cursiva, listas con viñetas,
 * numeradas y de tareas (marcadas y sin marcar) y una muy corta, para ver el
 * listado con extractos de todos los tamaños.
 */

const text = (value: string): TeachingTextNode => ({ type: 'text', text: value });
const bold = (value: string): TeachingTextNode => ({
    type: 'text',
    text: value,
    marks: [{ type: 'bold' }],
});
const italic = (value: string): TeachingTextNode => ({
    type: 'text',
    text: value,
    marks: [{ type: 'italic' }],
});

const paragraph = (...content: TeachingTextNode[]): TeachingBlock => ({
    type: 'paragraph',
    content,
});
const item = (...content: TeachingTextNode[]): TeachingListItemNode => ({
    type: 'listItem',
    content: [{ type: 'paragraph', content }],
});
const task = (checked: boolean, value: string) => ({
    type: 'taskItem' as const,
    attrs: { checked },
    content: [{ type: 'paragraph' as const, content: [text(value)] }],
});

interface DemoTeaching {
    title: string;
    daysAgo: number;
    content: TeachingBlock[];
}

const ENSENANZAS: DemoTeaching[] = [
    {
        title: 'La paciencia de la siembra',
        daysAgo: 4,
        content: [
            paragraph(
                text('Santiago 5:7 compara la espera con la del labrador: '),
                italic(
                    '«el labrador espera el fruto precioso de la tierra, aguardando con paciencia»',
                ),
                text('.'),
            ),
            paragraph(bold('Tres cosas que hace el labrador mientras espera:')),
            {
                type: 'orderedList',
                content: [
                    item(text('Riega, aunque no vea nada todavía.')),
                    item(text('No desentierra la semilla para ver cómo va.')),
                    item(text('Sabe que la lluvia no depende de él.')),
                ],
            },
        ],
    },
    {
        title: 'Cómo acompañar a quien está pasando un duelo',
        daysAgo: 11,
        content: [
            paragraph(
                text('Lo primero no es hablar. '),
                bold('Estar'),
                text(' es la mayor parte del acompañamiento, y se nota cuando falta.'),
            ),
            {
                type: 'bulletList',
                content: [
                    item(text('Preguntar «¿cómo estás hoy?» y no «¿cómo estás?».')),
                    item(text('No llenar los silencios con versículos.')),
                    item(text('Volver a llamar a las dos semanas, cuando ya nadie llama.')),
                    item(bold('Nunca'), text(' decir «Dios se lo llevó por algo».')),
                ],
            },
            paragraph(
                italic(
                    'Job tuvo a sus tres amigos callados siete días, y fue lo mejor que dijeron.',
                ),
            ),
        ],
    },
    {
        title: 'Preparar la reunión del viernes',
        daysAgo: 18,
        content: [
            paragraph(text('Lo que hay que tener listo antes de que llegue la gente:')),
            {
                type: 'taskList',
                content: [
                    task(true, 'Confirmar quién abre el local'),
                    task(true, 'Probar el micrófono inalámbrico'),
                    task(false, 'Imprimir las hojas de cánticos'),
                    task(false, 'Avisar a los hermanos de Benidorm del cambio de hora'),
                    task(false, 'Preparar el resumen de la semana para la oración final'),
                ],
            },
        ],
    },
    {
        title: 'El barco y el faro',
        daysAgo: 33,
        content: [
            paragraph(
                text('Una nave se gobierna con '),
                bold('dos cosas a la vez'),
                text(': el timón en la mano y el faro en la vista.'),
            ),
            paragraph(
                text(
                    'Quien solo mira el faro choca con las rocas de al lado. Quien solo mira el timón da vueltas en el sitio. ',
                ),
                italic('La enseñanza es aprender a mirar lejos sin soltar lo que tienes cerca.'),
            ),
            paragraph(
                text(
                    'Para la próxima vez que lo cuente: empezar por la imagen, dejar la aplicación para el final y no pasar de diez minutos.',
                ),
            ),
        ],
    },
    {
        title: 'Los dones no son un premio',
        daysAgo: 62,
        content: [
            paragraph(
                text('1 Corintios 12 empieza con '),
                bold('«no quiero que ignoréis»'),
                text(' y acaba con un cuerpo: nadie lo tiene todo y nadie sobra.'),
            ),
            {
                type: 'bulletList',
                content: [
                    item(text('Un don se recibe, no se gana.')),
                    item(text('Un don es para los demás antes que para uno.')),
                    item(text('Un don sin amor (cap. 13) «es como metal que resuena».')),
                ],
            },
            paragraph(
                text(
                    'Pregunta para la reunión: ¿qué don has visto en otro este mes y no se lo has dicho?',
                ),
            ),
        ],
    },
    {
        title: 'Una frase para no olvidar',
        daysAgo: 90,
        content: [paragraph(italic('La fidelidad es un hábito antes que un sentimiento.'))],
    },
];

function toInput(one: DemoTeaching, today: IsoDate): CreateTeachingInput {
    return {
        title: one.title,
        receivedAt: addDays(today, -one.daysAgo),
        body: { type: 'doc', content: one.content },
    };
}

/** Crea las enseñanzas de prueba de ese usuario. No hace nada si ya tiene alguna. */
export async function seedDemoTeachings(ownerId: string): Promise<void> {
    const db = await getDb();
    const existing = await db.getFirstAsync<{ total: number }>(
        'SELECT COUNT(*) AS total FROM teachings WHERE owner_id = ? AND deleted_at IS NULL',
        ownerId,
    );
    if ((existing?.total ?? 0) > 0) return;

    const today: IsoDate = todayIso();
    for (const one of ENSENANZAS) {
        await createTeaching(ownerId, toInput(one, today));
    }
}
