/* eslint-disable react-refresh/only-export-components -- este fichero es la
   tabla de rutas, no un módulo de componentes: exporta `router`. */
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';

import { SetupGate } from '@/components/auth/setup-gate';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/routes/app-layout';
import { DashboardPage } from '@/routes/dashboard';
import { PlaceholderPage } from '@/routes/placeholder';

// Las pantallas de autenticación no hacen falta hasta que el usuario sale.
const LoginPage = lazy(() =>
  import('@/routes/login').then((module) => ({ default: module.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('@/routes/register').then((module) => ({ default: module.RegisterPage })),
);
const SetupPage = lazy(() =>
  import('@/routes/setup').then((module) => ({ default: module.SetupPage })),
);
const SettingsPage = lazy(() =>
  import('@/routes/settings').then((module) => ({ default: module.SettingsPage })),
);
// La administración de accesos solo la abre un administrador: su código no
// tiene por qué viajar en el paquete de todos los demás.
const UsersPage = lazy(() =>
  import('@/routes/users').then((module) => ({ default: module.UsersPage })),
);
const LabPage = lazy(() => import('@/routes/lab').then((module) => ({ default: module.LabPage })));

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  // Mientras la instalación no tenga ninguna cuenta, acceder y darse de alta
  // llevan a crear la de administrador: un login que nadie podría pasar no
  // sirve de nada (ver SetupGate).
  {
    path: '/login',
    element: (
      <SetupGate expects="ready">
        <Lazy>
          <LoginPage />
        </Lazy>
      </SetupGate>
    ),
  },
  {
    path: '/register',
    element: (
      <SetupGate expects="ready">
        <Lazy>
          <RegisterPage />
        </Lazy>
      </SetupGate>
    ),
  },
  {
    path: '/setup',
    element: (
      <SetupGate expects="empty">
        <Lazy>
          <SetupPage />
        </Lazy>
      </SetupGate>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: 'calendar',
        element: (
          <PlaceholderPage titleKey="nav.calendar" rfc="0002-calendario-de-programaciones.md" />
        ),
      },
      {
        path: 'believers',
        element: <PlaceholderPage titleKey="nav.believers" rfc="0003-creyentes-y-notas.md" />,
      },
      {
        path: 'prophecies',
        element: <PlaceholderPage titleKey="nav.prophecies" rfc="0004-profecias-personales.md" />,
      },
      {
        path: 'dreams',
        element: <PlaceholderPage titleKey="nav.dreams" rfc="0005-suenos-personales.md" />,
      },
      {
        path: 'communications',
        element: <PlaceholderPage titleKey="nav.communications" rfc="0006-comunicaciones.md" />,
      },
      // Muestrario de piezas de interfaz. No está en la navegación: se abre a
      // mano cuando hay que mirar con calma algo que solo se ve un instante.
      {
        path: 'lab',
        element: (
          <Lazy>
            <LabPage />
          </Lazy>
        ),
      },
      {
        path: 'users',
        element: (
          <Lazy>
            <UsersPage />
          </Lazy>
        ),
      },
      {
        path: 'settings',
        element: (
          <Lazy>
            <SettingsPage />
          </Lazy>
        ),
      },
    ],
  },
]);
