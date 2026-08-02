import type { Translation } from './es';

export const pt = {
  common: {
    appName: 'PastorTools',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    close: 'Fechar',
    search: 'Pesquisar',
    loading: 'A carregar…',
    retry: 'Tentar novamente',
    back: 'Voltar',
    comingSoon: 'Em breve',
  },
  nav: {
    dashboard: 'Início',
    calendar: 'Calendário',
    believers: 'Crentes',
    prophecies: 'Profecias',
    dreams: 'Sonhos',
    communications: 'Comunicações',
    settings: 'Definições',
  },
  auth: {
    signIn: 'Iniciar sessão',
    signUp: 'Criar conta',
    signOut: 'Terminar sessão',
    email: 'Email',
    password: 'Palavra-passe',
    name: 'Nome',
    rememberMe: 'Manter sessão iniciada',
    noAccount: 'Ainda não tem conta?',
    haveAccount: 'Já tem conta?',
    invalidCredentials: 'O email ou a palavra-passe estão incorretos',
    welcome: 'Bem-vindo, {{name}}',
    signingIn: 'A entrar…',
  },
  theme: {
    label: 'Tema',
    light: 'Claro',
    dark: 'Escuro',
    system: 'Sistema',
  },
  language: {
    label: 'Idioma',
  },
  settings: {
    title: 'Definições',
    appearance: 'Aparência',
    profile: 'Perfil',
  },
  profile: {
    title: 'O meu perfil',
    church: 'Igreja',
    phone: 'Telefone',
    timezone: 'Fuso horário',
    bio: 'Sobre mim',
    saved: 'Perfil guardado',
  },
  home: {
    title: 'Painel',
    subtitle: 'As suas ferramentas pastorais num só lugar',
  },
  errors: {
    generic: 'Algo correu mal. Tente novamente.',
    network: 'Não é possível contactar o servidor',
    unauthorized: 'Precisa de iniciar sessão',
    notFound: 'Não encontrado',
    validation: 'Verifique os dados introduzidos',
  },
  pwa: {
    updateAvailable: 'Está disponível uma nova versão',
    reload: 'Atualizar',
    offlineReady: 'A aplicação já funciona sem ligação',
  },
} satisfies Translation;

export default pt;
