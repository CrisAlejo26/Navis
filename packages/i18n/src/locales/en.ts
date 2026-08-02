import type { Translation } from './es';

export const en = {
  common: {
    appName: 'PastorTools',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    search: 'Search',
    loading: 'Loading…',
    retry: 'Retry',
    back: 'Back',
    comingSoon: 'Coming soon',
  },
  nav: {
    dashboard: 'Home',
    calendar: 'Calendar',
    believers: 'Believers',
    prophecies: 'Prophecies',
    dreams: 'Dreams',
    communications: 'Communications',
    settings: 'Settings',
  },
  auth: {
    signIn: 'Sign in',
    signUp: 'Create account',
    signOut: 'Sign out',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    rememberMe: 'Keep me signed in',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    invalidCredentials: 'Email or password is incorrect',
    welcome: 'Welcome, {{name}}',
    signingIn: 'Signing in…',
  },
  theme: {
    label: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
  language: {
    label: 'Language',
  },
  settings: {
    title: 'Settings',
    appearance: 'Appearance',
    profile: 'Profile',
  },
  profile: {
    title: 'My profile',
    church: 'Church',
    phone: 'Phone',
    timezone: 'Time zone',
    bio: 'About me',
    saved: 'Profile saved',
  },
  home: {
    title: 'Dashboard',
    subtitle: 'Your pastoral tools in one place',
  },
  errors: {
    generic: 'Something went wrong. Please try again.',
    network: 'Cannot reach the server',
    unauthorized: 'You need to sign in',
    notFound: 'Not found',
    validation: 'Please check the information you entered',
  },
  pwa: {
    updateAvailable: 'A new version is available',
    reload: 'Update',
    offlineReady: 'The app now works offline',
  },
} satisfies Translation;

export default en;
