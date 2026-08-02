import type { Translation } from './es';

export const de = {
  common: {
    appName: 'PastorTools',
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    close: 'Schließen',
    search: 'Suchen',
    loading: 'Wird geladen…',
    retry: 'Erneut versuchen',
    back: 'Zurück',
    comingSoon: 'Demnächst',
  },
  nav: {
    dashboard: 'Start',
    calendar: 'Kalender',
    believers: 'Gläubige',
    prophecies: 'Prophetien',
    dreams: 'Träume',
    communications: 'Kommunikation',
    settings: 'Einstellungen',
  },
  auth: {
    signIn: 'Anmelden',
    signUp: 'Konto erstellen',
    signOut: 'Abmelden',
    email: 'E-Mail',
    password: 'Passwort',
    name: 'Name',
    rememberMe: 'Angemeldet bleiben',
    noAccount: 'Noch kein Konto?',
    haveAccount: 'Schon ein Konto?',
    invalidCredentials: 'E-Mail oder Passwort ist falsch',
    welcome: 'Willkommen, {{name}}',
    signingIn: 'Anmeldung läuft…',
  },
  theme: {
    label: 'Design',
    light: 'Hell',
    dark: 'Dunkel',
    system: 'System',
  },
  language: {
    label: 'Sprache',
  },
  settings: {
    title: 'Einstellungen',
    appearance: 'Darstellung',
    profile: 'Profil',
  },
  profile: {
    title: 'Mein Profil',
    church: 'Gemeinde',
    phone: 'Telefon',
    timezone: 'Zeitzone',
    bio: 'Über mich',
    saved: 'Profil gespeichert',
  },
  home: {
    title: 'Übersicht',
    subtitle: 'Ihre pastoralen Werkzeuge an einem Ort',
  },
  errors: {
    generic: 'Etwas ist schiefgelaufen. Bitte erneut versuchen.',
    network: 'Der Server ist nicht erreichbar',
    unauthorized: 'Sie müssen sich anmelden',
    notFound: 'Nicht gefunden',
    validation: 'Bitte überprüfen Sie Ihre Eingaben',
  },
  pwa: {
    updateAvailable: 'Eine neue Version ist verfügbar',
    reload: 'Aktualisieren',
    offlineReady: 'Die App funktioniert jetzt offline',
  },
} satisfies Translation;

export default de;
