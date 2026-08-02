import type { Translation } from './es';

export const fr = {
  common: {
    appName: 'PastorTools',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    close: 'Fermer',
    search: 'Rechercher',
    loading: 'Chargement…',
    retry: 'Réessayer',
    back: 'Retour',
    comingSoon: 'Bientôt disponible',
  },
  nav: {
    dashboard: 'Accueil',
    calendar: 'Calendrier',
    believers: 'Fidèles',
    prophecies: 'Prophéties',
    dreams: 'Rêves',
    communications: 'Communications',
    settings: 'Paramètres',
  },
  auth: {
    signIn: 'Se connecter',
    signUp: 'Créer un compte',
    signOut: 'Se déconnecter',
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    name: 'Nom',
    rememberMe: 'Rester connecté',
    noAccount: "Vous n'avez pas de compte ?",
    haveAccount: 'Vous avez déjà un compte ?',
    invalidCredentials: "L'e-mail ou le mot de passe est incorrect",
    welcome: 'Bienvenue, {{name}}',
    signingIn: 'Connexion…',
  },
  theme: {
    label: 'Thème',
    light: 'Clair',
    dark: 'Sombre',
    system: 'Système',
  },
  language: {
    label: 'Langue',
  },
  settings: {
    title: 'Paramètres',
    appearance: 'Apparence',
    profile: 'Profil',
  },
  profile: {
    title: 'Mon profil',
    church: 'Église',
    phone: 'Téléphone',
    timezone: 'Fuseau horaire',
    bio: 'À propos de moi',
    saved: 'Profil enregistré',
  },
  home: {
    title: 'Tableau de bord',
    subtitle: 'Vos outils pastoraux en un seul endroit',
  },
  errors: {
    generic: "Une erreur s'est produite. Veuillez réessayer.",
    network: 'Impossible de joindre le serveur',
    unauthorized: 'Vous devez vous connecter',
    notFound: 'Introuvable',
    validation: 'Veuillez vérifier les informations saisies',
  },
  pwa: {
    updateAvailable: 'Une nouvelle version est disponible',
    reload: 'Mettre à jour',
    offlineReady: "L'application fonctionne désormais hors ligne",
  },
} satisfies Translation;

export default fr;
