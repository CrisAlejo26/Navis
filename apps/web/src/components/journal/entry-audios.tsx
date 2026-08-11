import { journalAudioPath, type JournalEntryAudio } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { AudioPlayer } from '@/components/audio/audio-player';

/**
 * Los audios de la entrada, ya subidos (§7.7).
 *
 * Aquí solo se escuchan: grabar y adjuntar es cosa del formulario. **Vacío de
 * audios: no se enseña nada** — una entrada sin audios no es un vacío que
 * haya que anunciar.
 */
export function EntryAudios({ audios }: { audios: JournalEntryAudio[] }) {
  const { t } = useTranslation();
  if (audios.length === 0) return null;

  return (
    <section
      style={{ animationDelay: '180ms' }}
      className="gap-2 p-4 sm:p-5 animate-rise-in flex flex-col rounded-xl border bg-card"
    >
      <h2 className="text-sm font-medium">{t('journal.audiosField')}</h2>

      <ul className="gap-2 flex flex-col">
        {audios.map((audio) => (
          <li key={audio.id}>
            <AudioPlayer audio={audio} path={journalAudioPath} />
          </li>
        ))}
      </ul>
    </section>
  );
}
