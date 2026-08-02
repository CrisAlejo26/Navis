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
  health: ['health'] as const,
} as const;
