/* eslint-disable react-refresh/only-export-components -- este fichero es la
   tabla de rutas, no un módulo de componentes: exporta `router`. */
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';

import { SetupGate } from '@/components/auth/setup-gate';
import { ChurchGate } from '@/components/church-gate';
import { ProtectedRoute } from '@/components/protected-route';
import { RequirePermission } from '@/components/require-permission';
import { AppLayout } from '@/routes/app-layout';
import { DashboardPage } from '@/routes/dashboard';
import { PUENTES } from '@/lib/placeholders';
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
const CalendarPage = lazy(() =>
  import('@/routes/calendar').then((module) => ({ default: module.CalendarPage })),
);
const CalendarSettingsPage = lazy(() =>
  import('@/routes/calendar-settings').then((module) => ({
    default: module.CalendarSettingsPage,
  })),
);
const BelieversPage = lazy(() =>
  import('@/routes/believers').then((module) => ({ default: module.BelieversPage })),
);
const BelieverPage = lazy(() =>
  import('@/routes/believer').then((module) => ({ default: module.BelieverPage })),
);
const GiftsPage = lazy(() =>
  import('@/routes/gifts').then((module) => ({ default: module.GiftsPage })),
);
const LabPage = lazy(() => import('@/routes/lab').then((module) => ({ default: module.LabPage })));
const NoAccessPage = lazy(() =>
  import('@/routes/no-access').then((module) => ({ default: module.NoAccessPage })),
);
const WelcomePage = lazy(() =>
  import('@/routes/welcome').then((module) => ({ default: module.WelcomePage })),
);

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
  // La primera iglesia se pide a pantalla completa, fuera del layout: todavía
  // no hay espacio de trabajo sobre el que enseñar una navegación.
  {
    path: '/welcome',
    element: (
      <ProtectedRoute>
        <Lazy>
          <WelcomePage />
        </Lazy>
      </ProtectedRoute>
    ),
  },
  // Con sesión pero sin ninguna pantalla que abrir: fuera del layout de la
  // aplicación, porque su menú estaría vacío.
  {
    path: '/no-access',
    element: (
      <ProtectedRoute>
        <Lazy>
          <NoAccessPage />
        </Lazy>
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <ChurchGate>
          <AppLayout />
        </ChurchGate>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <RequirePermission permission="dashboard.view">
            <DashboardPage />
          </RequirePermission>
        ),
      },
      ...PUENTES.map(({ path, titleKey, rfc, permission }) => ({
        path,
        element: (
          <RequirePermission permission={permission}>
            <PlaceholderPage titleKey={titleKey} rfc={rfc} />
          </RequirePermission>
        ),
      })),
      // `/calendar` sin más redirige al primero (ver `CalendarPage`), y cada
      // calendario vive en su `slug`: `/calendar/pulpito` (RFC 0002 D15).
      {
        path: 'calendar/:slug?',
        element: (
          <RequirePermission permission="calendar.view">
            <Lazy>
              <CalendarPage />
            </Lazy>
          </RequirePermission>
        ),
      },
      {
        path: 'calendar/:slug/settings',
        element: (
          <RequirePermission permission="calendar.manage">
            <Lazy>
              <CalendarSettingsPage />
            </Lazy>
          </RequirePermission>
        ),
      },
      // `/believers/gifts` va declarada **antes** que `/believers/:id`: con el
      // orden al revés, «gifts» se resolvería como el identificador de alguien.
      {
        path: 'believers',
        element: (
          <RequirePermission permission="believers.view">
            <Lazy>
              <BelieversPage />
            </Lazy>
          </RequirePermission>
        ),
      },
      {
        path: 'believers/gifts',
        element: (
          <RequirePermission permission="believers.manage">
            <Lazy>
              <GiftsPage />
            </Lazy>
          </RequirePermission>
        ),
      },
      {
        path: 'believers/:id',
        element: (
          <RequirePermission permission="believers.view">
            <Lazy>
              <BelieverPage />
            </Lazy>
          </RequirePermission>
        ),
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
          <RequirePermission permission="users.view">
            <Lazy>
              <UsersPage />
            </Lazy>
          </RequirePermission>
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
