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
  believers: {
    all: ['believers'] as const,
    list: (query: object) => [...queryKeys.believers.all, 'list', query] as const,
  },
  health: ['health'] as const,
} as const;
