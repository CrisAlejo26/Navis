/**
 * La semana con la que arranca **cada sede en cada calendario**.
 *
 * Es un punto de partida, no una ley: se edita entero desde la configuración
 * del calendario. Está aquí porque lo usan la migración, la API al crear un
 * calendario o una sede, y los tests.
 *
 * Los nombres van en español y **no se traducen**: son datos de cada iglesia,
 * igual que las fases y las sedes (Regla 2 §6). Entre semana se reúne a las
 * 19:00; el sábado a las 18:00 y el domingo por la mañana.
 *
 * **Por sede**, no por iglesia: en Elda la alabanza puede caer otro día que en
 * Benidorm, y por eso la semana se siembra en cada una y se ajusta allí.
 */
export interface WeeklyMeeting {
  /** Domingo es 0, como en `Date.getDay()`. */
  weekday: number;
  name: string;
  startTime: string;
  phases: readonly string[];
}

const ALABANZA = ['Introducción', 'Final'] as const;
const ESTUDIO = ['Introducción', 'Final'] as const;
const ENSEÑANZA = ['Introducción', 'Predicación', 'Testimonios'] as const;

export const DEFAULT_WEEK: readonly WeeklyMeeting[] = [
  { weekday: 1, name: 'Alabanza', startTime: '19:00', phases: ALABANZA },
  { weekday: 2, name: 'Estudio bíblico', startTime: '19:00', phases: ESTUDIO },
  { weekday: 3, name: 'Enseñanza', startTime: '19:00', phases: ENSEÑANZA },
  { weekday: 4, name: 'Alabanza', startTime: '19:00', phases: ALABANZA },
  { weekday: 5, name: 'Alabanza', startTime: '19:00', phases: ALABANZA },
  { weekday: 6, name: 'Estudio bíblico', startTime: '18:00', phases: ESTUDIO },
  { weekday: 0, name: 'Enseñanza', startTime: '10:00', phases: ENSEÑANZA },
];
