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
  dashboard: {
    summary: ['dashboard', 'summary'] as const,
  },
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
   * Las listas de la iglesia (RFC 0010).
   *
   * Todo cuelga de la misma raíz porque casi todo se toca a la vez: meter a una
   * persona cambia el panel del tablón, la ficha, el solapamiento y los puntos
   * de creyentes. Las concesiones también: quitarle una lista a un acceso cambia
   * su fila del directorio **y** la pestaña de compartir de esa lista.
   *
   * `public` va aparte y **sin sesión**: es la única consulta del proyecto que
   * hace alguien que no ha entrado, y no debe invalidarse al cambiar de iglesia.
   */
  lists: {
    all: ['lists'] as const,
    one: (id: string) => [...queryKeys.lists.all, 'one', id] as const,
    stats: (id: string) => [...queryKeys.lists.all, 'stats', id] as const,
    accessLog: (id: string) => [...queryKeys.lists.all, 'accessLog', id] as const,
    memberships: ['lists', 'memberships'] as const,
    viewers: ['lists', 'viewers'] as const,
    public: (token: string) => ['public-list', token] as const,
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
  /**
   * Tareas y hábitos (RFC 0018). Etiquetas, tareas y hábitos cuelgan de la
   * misma raíz: completar una tarea mueve su fila, la racha y las
   * estadísticas a la vez, e invalidar `all` es más barato que acertar cuál
   * de las cuatro hay que refrescar.
   */
  tasks: {
    all: ['tasks'] as const,
    tags: ['tasks', 'tags'] as const,
    list: (query: object) => [...queryKeys.tasks.all, 'list', query] as const,
    streak: ['tasks', 'streak'] as const,
    stats: (query: object) => [...queryKeys.tasks.all, 'stats', query] as const,
    one: (id: string) => [...queryKeys.tasks.all, 'one', id] as const,
    habitsList: (query: object) => [...queryKeys.tasks.all, 'habitsList', query] as const,
    habitsStats: (query: object) => [...queryKeys.tasks.all, 'habitsStats', query] as const,
    habitOne: (id: string) => [...queryKeys.tasks.all, 'habitOne', id] as const,
  },
  /**
   * El cuaderno de la iglesia (RFC 0017). Todo cuelga de la misma raíz porque
   * casi todo se toca a la vez: guardar una entrada mueve la fila del listado
   * y las cuentas de la portada. Es de la iglesia activa (D1), así que un
   * cambio de espacio de trabajo la invalida con el resto (`invalidateQueries()`
   * sin clave, en `useSetActiveChurch`).
   */
  journal: {
    all: ['journal'] as const,
    list: (query: object) => [...queryKeys.journal.all, 'list', query] as const,
    stats: ['journal', 'stats'] as const,
    one: (id: string) => [...queryKeys.journal.all, 'one', id] as const,
  },
  /**
   * Comunicaciones (RFC 0016). Todo cuelga de la misma raíz porque casi todo
   * se toca a la vez: enviar un mensaje mueve la fila del canal en la lista
   * (no leídos, último mensaje) y su propio historial.
   */
  chat: {
    all: ['chat'] as const,
    channels: (query: object) => [...queryKeys.chat.all, 'channels', query] as const,
    channel: (id: string) => [...queryKeys.chat.all, 'channel', id] as const,
    contacts: (search: string) => [...queryKeys.chat.all, 'contacts', search] as const,
    messages: (channelId: string) => [...queryKeys.chat.all, 'messages', channelId] as const,
  },
  health: ['health'] as const,
  /** La búsqueda de ciudades del selector geográfico (RFC 0011, ampliación). */
  geocode: {
    cities: (query: object) => ['geocode', 'cities', query] as const,
  },
} as const;
