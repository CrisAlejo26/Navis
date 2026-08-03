/* eslint-disable react-refresh/only-export-components -- este fichero es la
   tabla de rutas, no un módulo de componentes: exporta `router`. */
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';

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
const SettingsPage = lazy(() =>
  import('@/routes/settings').then((module) => ({ default: module.SettingsPage })),
);

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Lazy>
        <LoginPage />
      </Lazy>
    ),
  },
  {
    path: '/register',
    element: (
      <Lazy>
        <RegisterPage />
      </Lazy>
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
