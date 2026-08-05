import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderState = 'idle' | 'recording' | 'unsupported' | 'denied';

export interface Recorder {
  state: RecorderState;
  /** Segundos grabados, para que se vea que está pasando algo. */
  seconds: number;
  start: () => Promise<void>;
  stop: () => void;
}

/** Lo que el navegador sabe grabar, en orden de preferencia. */
const FORMATOS = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];

function mejorFormato(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return FORMATOS.find((tipo) => MediaRecorder.isTypeSupported(tipo));
}

/**
 * Grabar una nota de voz desde el navegador.
 *
 * `MediaRecorder` está en todos los navegadores que soporta esta aplicación,
 * pero **solo en contextos seguros**: en desarrollo funciona por `localhost` y
 * en producción por HTTPS. Si no está, se dice y queda el adjuntar, que
 * siempre funciona.
 *
 * El `stream` se para al terminar —y también al desmontar—: sin eso, el punto
 * rojo del micrófono se queda encendido en la pestaña aunque nadie grabe, que
 * es de las cosas que más desconfianza dan en una aplicación.
 */
export function useRecorder(onFinish: (blob: Blob, seconds: number) => void): Recorder {
  const [state, setState] = useState<RecorderState>('idle');
  const [seconds, setSeconds] = useState(0);

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  // La última versión de la callback, sin que `start` dependa de ella: si
  // dependiera, cambiaría en cada render del componente que lo usa y pararía
  // la grabación a medias. Se actualiza en un efecto y no durante el render.
  const finish = useRef(onFinish);
  useEffect(() => {
    finish.current = onFinish;
  });

  const release = useCallback(() => {
    for (const track of recorder.current?.stream.getTracks() ?? []) track.stop();
    recorder.current = null;
  }, []);

  useEffect(() => release, [release]);

  useEffect(() => {
    if (state !== 'recording') return;

    const timer = setInterval(() => {
      setSeconds(Math.round((Date.now() - startedAt.current) / 1000));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [state]);

  const start = useCallback(async () => {
    const mimeType = mejorFormato();
    if (!mimeType || !navigator.mediaDevices) {
      setState('unsupported');
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      // Denegado, o sin micrófono. Para quien graba es lo mismo: no se puede.
      setState('denied');
      return;
    }

    const media = new MediaRecorder(stream, { mimeType });
    chunks.current = [];
    startedAt.current = Date.now();

    media.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.current.push(event.data);
    };
    media.onstop = () => {
      const blob = new Blob(chunks.current, { type: mimeType });
      const duration = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));

      release();
      setState('idle');
      setSeconds(0);
      if (blob.size > 0) finish.current(blob, duration);
    };

    recorder.current = media;
    setSeconds(0);
    setState('recording');
    media.start();
  }, [release]);

  const stop = useCallback(() => {
    recorder.current?.stop();
  }, []);

  return { state, seconds, start, stop };
}
