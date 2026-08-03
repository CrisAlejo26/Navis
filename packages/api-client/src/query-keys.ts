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
  health: ['health'] as const,
} as const;
