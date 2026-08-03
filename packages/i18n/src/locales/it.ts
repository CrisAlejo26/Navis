import type { Translation } from './es';

export const it = {
  common: {
    appName: 'Fidus',
    save: 'Salva',
    cancel: 'Annulla',
    delete: 'Elimina',
    edit: 'Modifica',
    close: 'Chiudi',
    search: 'Cerca',
    loading: 'Caricamento…',
    retry: 'Riprova',
    back: 'Indietro',
    comingSoon: 'Prossimamente',
  },
  nav: {
    dashboard: 'Home',
    calendar: 'Calendario',
    believers: 'Credenti',
    prophecies: 'Profezie',
    dreams: 'Sogni',
    communications: 'Comunicazioni',
    settings: 'Impostazioni',
    more: 'Altro',
  },
  auth: {
    signIn: 'Accedi',
    signUp: 'Crea un account',
    signOut: 'Esci',
    email: 'Email',
    password: 'Password',
    name: 'Nome',
    rememberMe: 'Resta connesso',
    noAccount: 'Non hai un account?',
    haveAccount: 'Hai già un account?',
    invalidCredentials: 'Email o password non corretti',
    welcome: 'Benvenuto, {{name}}',
    signingIn: 'Accesso in corso…',
  },
  theme: {
    label: 'Tema',
    light: 'Chiaro',
    dark: 'Scuro',
    system: 'Sistema',
  },
  language: {
    label: 'Lingua',
  },
  settings: {
    title: 'Impostazioni',
    appearance: 'Aspetto',
    profile: 'Profilo',
    connection: 'Connessione',
  },
  profile: {
    title: 'Il mio profilo',
    church: 'Chiesa',
    phone: 'Telefono',
    timezone: 'Fuso orario',
    bio: 'Su di me',
    saved: 'Profilo salvato',
  },
  home: {
    title: 'Pannello',
    subtitle: 'I tuoi strumenti pastorali in un unico posto',
  },
  errors: {
    generic: 'Qualcosa è andato storto. Riprova.',
    network: 'Impossibile raggiungere il server',
    unauthorized: 'Devi accedere',
    notFound: 'Non trovato',
    validation: 'Controlla i dati inseriti',
  },
  pwa: {
    updateAvailable: 'È disponibile una nuova versione',
    reload: 'Aggiorna',
    offlineReady: "L'app ora funziona offline",
  },
} satisfies Translation;

export default it;
