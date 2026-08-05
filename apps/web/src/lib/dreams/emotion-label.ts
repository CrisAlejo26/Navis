import { isSystemEmotionSlug, type Emotion } from '@navis/shared';
import { useTranslation } from 'react-i18next';

/** Lo justo para saber cómo se llama: la ficha y el listado traen más cosas. */
export type NamedEmotion = Pick<Emotion, 'slug' | 'name'>;

/**
 * Cómo se llama una emoción (RFC 0005 D4).
 *
 * Las **de serie** no guardan texto: traen `slug` y se traducen aquí, que es lo
 * único que las deja salir en los seis idiomas. Las **propias** guardan el
 * texto que escribió su dueño y se enseñan tal cual, sin tocarlas: están en su
 * idioma y no las lee nadie más.
 *
 * La clave se construye a partir de un `slug` ya estrechado a la unión de los
 * doce, así que `t()` la sigue comprobando en tiempo de compilación: no es una
 * clave al vuelo de las que prohíbe la Regla 2 §3.
 */
export function useEmotionLabel(): (emotion: NamedEmotion) => string {
  const { t } = useTranslation();

  return (emotion: NamedEmotion) => {
    if (emotion.slug !== null && isSystemEmotionSlug(emotion.slug)) {
      return t(`dreams.emotions.${emotion.slug}`);
    }

    return emotion.name ?? '';
  };
}
