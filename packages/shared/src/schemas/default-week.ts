/**
 * La semana con la que arranca **cada sede en cada calendario**.
 *
 * Es un punto de partida, no una ley: se edita entera desde la configuración
 * del calendario —un festivo, un cambio de hora, un turno más—. Está aquí
 * porque lo usan la migración, la API al crear un calendario o una sede, y los
 * tests.
 *
 * Los nombres van en español y **no se traducen**: son datos de cada iglesia,
 * igual que las fases y las sedes (Regla 2 §6).
 *
 * **Cada ministerio tiene la suya**, porque el trabajo es distinto: el púlpito
 * reparte los tramos de la reunión, recepción hace turnos de puerta que
 * empiezan antes, y sonido cubre el encuentro entero con dos puestos.
 */
export interface WeeklyMeeting {
  /** Domingo es 0, como en `Date.getDay()`. */
  weekday: number;
  name: string;
  startTime: string;
  phases: readonly string[];
}

/** Los encuentros de la semana: el mismo esqueleto para todos los ministerios. */
const ENCUENTROS = [
  { weekday: 1, name: 'Alabanza', startTime: '19:00' },
  { weekday: 2, name: 'Estudio bíblico', startTime: '19:00' },
  { weekday: 3, name: 'Enseñanza', startTime: '19:00' },
  { weekday: 4, name: 'Alabanza', startTime: '19:00' },
  { weekday: 5, name: 'Alabanza', startTime: '19:00' },
  { weekday: 6, name: 'Estudio bíblico', startTime: '18:00' },
  { weekday: 0, name: 'Enseñanza', startTime: '10:00' },
] as const;

const conFases = (phases: (nombre: string) => readonly string[]): WeeklyMeeting[] =>
  ENCUENTROS.map((encuentro) => ({ ...encuentro, phases: phases(encuentro.name) }));

/**
 * Púlpito: los tramos de la reunión más los dos puestos que hay **todos los
 * días** —quien queda encargado y quien abre la iglesia—.
 *
 * La enseñanza lleva predicación y testimonios en lugar del cierre; la
 * alabanza y el estudio, apertura y final.
 */
const FIJOS = ['Encargado', 'Abre iglesia'] as const;

export const DEFAULT_WEEK: readonly WeeklyMeeting[] = conFases((nombre) =>
  nombre === 'Enseñanza'
    ? ['Introducción', 'Predicación', 'Testimonios', ...FIJOS]
    : ['Introducción', 'Final', ...FIJOS],
);

/**
 * Recepción: **dos turnos de puerta** que empiezan media hora antes del
 * encuentro y se solapan con él. El sábado va una hora antes y el domingo por
 * la mañana, siguiendo al encuentro.
 *
 * Las fases se llaman por su horario porque es lo que se mira al repartir:
 * «¿quién está de seis y media a siete y media?».
 */
const TURNOS: Record<number, { startTime: string; phases: readonly string[] }> = {
  6: { startTime: '17:30', phases: ['17:30 – 18:30', '18:30 – 19:30'] },
  0: { startTime: '09:30', phases: ['09:30 – 10:30', '10:30 – 11:30'] },
};

const ENTRE_SEMANA = { startTime: '18:30', phases: ['18:30 – 19:30', '19:30 – 20:30'] } as const;

export const RECEPTION_WEEK: readonly WeeklyMeeting[] = ENCUENTROS.map((encuentro) => ({
  weekday: encuentro.weekday,
  name: 'Recepción',
  ...(TURNOS[encuentro.weekday] ?? ENTRE_SEMANA),
}));

/** Sonido: un solo turno por encuentro, con dos puestos. */
export const SOUND_WEEK: readonly WeeklyMeeting[] = conFases(() => ['Equipo de sonido', 'Apoyo']);

/** Biblias: un puesto por encuentro. */
export const BIBLES_WEEK: readonly WeeklyMeeting[] = conFases(() => ['Biblias']);

/**
 * La semana de serie de un ministerio. Un calendario sin ministerio arranca
 * con la del púlpito, que es la que describe la semana de la iglesia.
 */
export function defaultWeekFor(ministry: string | null | undefined): readonly WeeklyMeeting[] {
  if (ministry === 'recepcion') return RECEPTION_WEEK;
  if (ministry === 'sonido') return SOUND_WEEK;
  if (ministry === 'biblias') return BIBLES_WEEK;
  return DEFAULT_WEEK;
}
