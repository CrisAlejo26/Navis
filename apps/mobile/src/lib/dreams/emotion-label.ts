import { isSystemEmotionSlug, type Emotion } from '@navis/shared';
import { useTranslation } from 'react-i18next';

/** Lo justo para saber cómo se llama: la ficha y el listado traen más cosas. */
export type NamedEmotion = Pick<Emotion, 'slug' | 'name'>;

/**
 * Cómo se llama una emoción (RFC 0005 D4), igual que en la web: las **de
 * serie** no guardan texto, traen `slug` y se traducen aquí —lo único que las
 * deja salir en los seis idiomas—; las **propias** guardan el texto de su
 * dueño y se enseñan tal cual. El `slug` ya está estrechado a la unión de las
 * doce, así que `t()` sigue comprobando la clave en compilación (Regla 2 §3).
 */
export function useEmotionLabel(): (emotion: NamedEmotion) => string {
    const { t } = useTranslation();

    return (emotion) => {
        if (emotion.slug !== null && isSystemEmotionSlug(emotion.slug)) {
            return t(`dreams.emotions.${emotion.slug}`);
        }
        return emotion.name ?? '';
    };
}
