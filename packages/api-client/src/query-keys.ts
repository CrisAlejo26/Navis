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
  },
  users: {
    all: ['users'] as const,
    list: (query: object) => [...queryKeys.users.all, 'list', query] as const,
  },
  health: ['health'] as const,
} as const;
