/**
 * Español — idioma de referencia. Cualquier clave nueva se añade PRIMERO aquí:
 * el resto de idiomas se tipa contra este objeto, así que no compilará hasta
 * traducirla en todos.
 *
 * Sin `as const` a propósito: los valores deben ser `string` para que las otras
 * traducciones puedan satisfacer este mismo tipo.
 */
export const es = {
  common: {
    appName: 'PastorTools',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    close: 'Cerrar',
    search: 'Buscar',
    loading: 'Cargando…',
    retry: 'Reintentar',
    back: 'Volver',
    comingSoon: 'Próximamente',
  },
  nav: {
    dashboard: 'Inicio',
    calendar: 'Calendario',
    believers: 'Creyentes',
    prophecies: 'Profecías',
    dreams: 'Sueños',
    communications: 'Comunicaciones',
    settings: 'Ajustes',
  },
  auth: {
    signIn: 'Iniciar sesión',
    signUp: 'Crear cuenta',
    signOut: 'Cerrar sesión',
    email: 'Correo electrónico',
    password: 'Contraseña',
    name: 'Nombre',
    rememberMe: 'Mantener la sesión iniciada',
    noAccount: '¿Aún no tienes cuenta?',
    haveAccount: '¿Ya tienes cuenta?',
    invalidCredentials: 'El correo o la contraseña no son correctos',
    welcome: 'Bienvenido, {{name}}',
    signingIn: 'Entrando…',
  },
  theme: {
    label: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    system: 'Sistema',
  },
  language: {
    label: 'Idioma',
  },
  settings: {
    title: 'Ajustes',
    appearance: 'Apariencia',
    profile: 'Perfil',
  },
  profile: {
    title: 'Mi perfil',
    church: 'Iglesia',
    phone: 'Teléfono',
    timezone: 'Zona horaria',
    bio: 'Sobre mí',
    saved: 'Perfil guardado',
  },
  home: {
    title: 'Panel',
    subtitle: 'Tus herramientas pastorales en un solo sitio',
  },
  errors: {
    generic: 'Algo ha ido mal. Inténtalo de nuevo.',
    network: 'No hay conexión con el servidor',
    unauthorized: 'Necesitas iniciar sesión',
    notFound: 'No encontrado',
    validation: 'Revisa los datos introducidos',
  },
  pwa: {
    updateAvailable: 'Hay una versión nueva disponible',
    reload: 'Actualizar',
    offlineReady: 'La aplicación ya funciona sin conexión',
  },
};

export type Translation = typeof es;

export default es;
