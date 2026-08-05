/**
 * Claves de TanStack Query centralizadas: invalidar desde cualquier sitio sin
 * repetir literales sueltos por toda la aplicación.
 */
export const queryKeys = {
  session: ['session'] as const,
  profile: {
    all: ['profile'] as const,
    me: () => [...queryKeys.profile.all, 'me'] as const,
  },
  ai: {
    status: ['ai', 'status'] as const,
  },
  weather: ['weather'] as const,
  setup: {
    status: ['setup', 'status'] as const,
  },
  // Los filtros forman parte de la clave: cada combinación de búsqueda, orden
  // y página se cachea por separado y volver atrás es instantáneo.
  roles: {
    all: ['roles'] as const,
    list: (query: object) => [...queryKeys.roles.all, 'list', query] as const,
    /** El rol de quien ha entrado, con sus permisos. */
    mine: ['roles', 'mine'] as const,
  },
  /**
   * Las iglesias a las que llega la cuenta y cuál es la activa. Al cambiar de
   * iglesia se invalida `all`, y con ella todo lo que cuelgue de una.
   */
  churches: {
    all: ['churches'] as const,
    mine: ['churches', 'mine'] as const,
  },
  users: {
    all: ['users'] as const,
    list: (query: object) => [...queryKeys.users.all, 'list', query] as const,
  },
  /**
   * Todo lo del calendario cuelga de la misma raíz —incluidas sedes y
   * patrones— para que al asignar a alguien, al cambiar de sede o al cambiar
   * de iglesia baste con invalidar `all`.
   */
  calendar: {
    all: ['calendar'] as const,
    /** Los calendarios de la iglesia: púlpito, recepción, sonido… (D15). */
    calendars: ['calendar', 'calendars'] as const,
    range: (query: object) => [...queryKeys.calendar.all, 'range', query] as const,
    summary: (query: object) => [...queryKeys.calendar.all, 'summary', query] as const,
    congregations: ['calendar', 'congregations'] as const,
    patterns: (calendarId: string) => [...queryKeys.calendar.all, 'patterns', calendarId] as const,
    preachers: (query: object) => [...queryKeys.calendar.all, 'preachers', query] as const,
  },
  /**
   * Todo lo de creyentes cuelga de la misma raíz —bitácora y dones incluidos—
   * porque casi todo se toca a la vez: escribir una nota mueve la sonda de la
   * fila, las cuentas de la cabecera y, si es de tipo «don», la ficha.
   */
  believers: {
    all: ['believers'] as const,
    list: (query: object) => [...queryKeys.believers.all, 'list', query] as const,
    summary: ['believers', 'summary'] as const,
    one: (id: string) => [...queryKeys.believers.all, 'one', id] as const,
    notes: (id: string, query: object) => [...queryKeys.believers.all, 'notes', id, query] as const,
    noteDays: (id: string, range: object) =>
      [...queryKeys.believers.all, 'noteDays', id, range] as const,
    gifts: ['believers', 'gifts'] as const,
    ministries: ['believers', 'ministries'] as const,
  },
  /**
   * Las profecías de quien ha entrado (RFC 0004).
   *
   * Todo cuelga de la misma raíz porque casi todo se toca a la vez: anotar un
   * cumplimiento cambia el estado de la fila, las cuentas de la portada y el
   * gráfico mensual. **No lleva la iglesia en la clave**: no depende de ella
   * (D1), así que cambiar de espacio de trabajo no la invalida.
   */
  prophecies: {
    all: ['prophecies'] as const,
    list: (query: object) => [...queryKeys.prophecies.all, 'list', query] as const,
    stats: ['prophecies', 'stats'] as const,
    one: (id: string) => [...queryKeys.prophecies.all, 'one', id] as const,
  },
  dreams: {
    all: ['dreams'] as const,
    list: (query: object) => [...queryKeys.dreams.all, 'list', query] as const,
    stats: ['dreams', 'stats'] as const,
    one: (id: string) => [...queryKeys.dreams.all, 'one', id] as const,
    /** El vocabulario de emociones. Cuelga de sueños: sus cuentas cambian con ellos. */
    emotions: ['dreams', 'emotions'] as const,
  },
  health: ['health'] as const,
} as const;
