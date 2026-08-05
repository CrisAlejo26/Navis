import { useTranslation } from 'react-i18next';

import { api } from '@/lib/api';
import { formatSeconds, type AudioPath, type SavedAudio } from '@/lib/audio/audio';
import { cn } from '@/lib/cn';

/**
 * Un audio, con el reproductor del navegador.
 *
 * Nativo a propósito: trae play, barra, volumen, velocidad y teclado ya
 * resueltos, y en el teléfono se integra con los controles del sistema. Pintar
 * uno propio sería reimplementar todo eso peor.
 *
 * `crossOrigin="use-credentials"` no es decorativo: la API está en otro origen
 * y mira la cookie de sesión. Sin eso, el navegador pide el fichero **sin
 * cookie** y recibe un 401.
 */
export function AudioPlayer({
  audio,
  path,
  className,
}: {
  audio: SavedAudio;
  path: AudioPath;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <span className={cn('gap-2 min-w-0 flex items-center', className)}>
      <audio
        controls
        preload="none"
        crossOrigin="use-credentials"
        src={`${api.baseUrl}${path(audio.id)}`}
        className="h-9 min-w-0 flex-1"
      >
        <track kind="captions" />
      </audio>

      <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
        {audio.recorded ? t('common.audio.recorded') : t('common.audio.attached')}
        {audio.durationSeconds !== null && ` · ${formatSeconds(audio.durationSeconds)}`}
      </span>
    </span>
  );
}
