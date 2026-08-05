import { dreamAudioPath, type DreamAudio } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { AudioPlayer } from '@/components/audio/audio-player';

/**
 * Los audios del sueño, ya subidos (RFC 0005 D13).
 *
 * Aquí solo se escuchan: grabar y adjuntar es cosa del formulario, que es donde
 * está el botón de guardar. El reproductor es el mismo que el de la bitácora de
 * creyentes, con su ruta puesta.
 */
export function DreamAudios({ audios }: { audios: DreamAudio[] }) {
  const { t } = useTranslation();
  if (audios.length === 0) return null;

  return (
    <section
      style={{ animationDelay: '240ms' }}
      className="gap-2 p-4 sm:p-5 animate-rise-in flex flex-col rounded-xl border bg-card"
    >
      <h2 className="text-sm font-medium">{t('common.audio.title')}</h2>

      <ul className="gap-2 flex flex-col">
        {audios.map((audio) => (
          <li key={audio.id}>
            <AudioPlayer audio={audio} path={dreamAudioPath} />
          </li>
        ))}
      </ul>
    </section>
  );
}
