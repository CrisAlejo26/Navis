/* eslint-disable react-refresh/only-export-components -- este fichero es la
   tabla de rutas, no un módulo de componentes: exporta `router`. */
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, useParams } from 'react-router';
import { listPublicPath } from '@navis/shared';

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
const CommunicationsPage = lazy(() =>
  import('@/routes/communications').then((module) => ({ default: module.CommunicationsPage })),
);
const ConversationPage = lazy(() =>
  import('@/routes/conversation').then((module) => ({ default: module.ConversationPage })),
);
const ConversationEmptyPage = lazy(() =>
  import('@/routes/conversation-empty').then((module) => ({
    default: module.ConversationEmptyPage,
  })),
);
const BelieverPage = lazy(() =>
  import('@/routes/believer').then((module) => ({ default: module.BelieverPage })),
);
const GiftsPage = lazy(() =>
  import('@/routes/gifts').then((module) => ({ default: module.GiftsPage })),
);
const MinistriesPage = lazy(() =>
  import('@/routes/ministries').then((module) => ({ default: module.MinistriesPage })),
);
const ListsPage = lazy(() =>
  import('@/routes/lists').then((module) => ({ default: module.ListsPage })),
);
const ListPage = lazy(() =>
  import('@/routes/list').then((module) => ({ default: module.ListPage })),
);
// La página pública va en su propio trozo y **no arrastra el panel**: es la
// primera ruta que se carga sin sesión y sin iglesia (RFC 0010 §8.1).
const PublicListPage = lazy(() =>
  import('@/routes/public-list').then((module) => ({ default: module.PublicListPage })),
);
const TablesPage = lazy(() =>
  import('@/routes/tables').then((module) => ({ default: module.TablesPage })),
);
const TablePage = lazy(() =>
  import('@/routes/table').then((module) => ({ default: module.TablePage })),
);
const ListAccessPage = lazy(() =>
  import('@/routes/list-access').then((module) => ({ default: module.ListAccessPage })),
);
const PropheciesPage = lazy(() =>
  import('@/routes/prophecies').then((module) => ({ default: module.PropheciesPage })),
);
const PropheciesListPage = lazy(() =>
  import('@/routes/prophecies-list').then((module) => ({ default: module.PropheciesListPage })),
);
const ProphecyPage = lazy(() =>
  import('@/routes/prophecy').then((module) => ({ default: module.ProphecyPage })),
);
const DreamsPage = lazy(() =>
  import('@/routes/dreams').then((module) => ({ default: module.DreamsPage })),
);
const DreamsListPage = lazy(() =>
  import('@/routes/dreams-list').then((module) => ({ default: module.DreamsListPage })),
);
const DreamPage = lazy(() =>
  import('@/routes/dream').then((module) => ({ default: module.DreamPage })),
);
const JournalPage = lazy(() =>
  import('@/routes/journal').then((module) => ({ default: module.JournalPage })),
);
const JournalListPage = lazy(() =>
  import('@/routes/journal-list').then((module) => ({ default: module.JournalListPage })),
);
const JournalEntryPage = lazy(() =>
  import('@/routes/journal-entry').then((module) => ({ default: module.JournalEntryPage })),
);
const TasksPage = lazy(() =>
  import('@/routes/tasks').then((module) => ({ default: module.TasksPage })),
);
const TasksStatsPage = lazy(() =>
  import('@/routes/tasks-stats').then((module) => ({ default: module.TasksStatsPage })),
);
const TasksListPage = lazy(() =>
  import('@/routes/tasks-list').then((module) => ({ default: module.TasksListPage })),
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

/**
 * **La red de seguridad de `/l/<token>`**, que en producción no debería llegar
 * aquí nunca: ese prefijo lo atiende la API, que es quien escribe las etiquetas
 * `og:` de la tarjeta de WhatsApp (RFC 0010 D14).
 *
 * Está porque el bloque `location /l/` del proxy se instala **a mano** en el
 * servidor, y mientras no esté, el enlace cae en la SPA y muere en un 404 con
 * los nombres de media iglesia detrás. Que lleve a la lista es infinitamente
 * mejor que eso.
 *
 * Ojo con lo que **no** arregla: si esto se ejecuta, la vista previa del chat
 * sigue siendo la genérica de Navis, porque el rastreador no ejecuta
 * JavaScript. Ver la tarjeta bien es la señal de que el proxy está al día.
 */
function ShareLinkFallback() {
  const { token } = useParams<{ token: string }>();

  return <Navigate to={token ? listPublicPath(token) : '/'} replace />;
}

export const router = createBrowserRouter([
  /*
   * **La página pública de una lista** (RFC 0010 §8.1, D40).
   *
   * Va fuera de `ProtectedRoute` y fuera de `AppLayout`, al lado de `/login`:
   * dentro del layout arrastraría el selector de iglesia, la barra lateral y una
   * petición de sesión que no hay. Y va declarada **antes** que `/lists/:slug`,
   * o «s» se leería como el slug de una lista —la misma trampa de
   * `/prophecies/list` y `/dreams/list`—.
   */
  {
    path: '/lists/s/:token',
    element: (
      <Lazy>
        <PublicListPage />
      </Lazy>
    ),
  },
  { path: '/l/:token', element: <ShareLinkFallback /> },
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
      // Maestro-detalle con rutas anidadas (RFC 0016 §5): `index` es el hueco
      // vacío de escritorio cuando no hay ninguna conversación abierta, y
      // `:channelId` es la conversación. En móvil, `CommunicationsPage`
      // enseña una vista cada vez y `index` no se ve nunca (Regla 5).
      {
        path: 'communications',
        element: (
          <RequirePermission permission="communications.view">
            <Lazy>
              <CommunicationsPage />
            </Lazy>
          </RequirePermission>
        ),
        children: [
          {
            index: true,
            element: (
              <Lazy>
                <ConversationEmptyPage />
              </Lazy>
            ),
          },
          {
            path: ':channelId',
            element: (
              <Lazy>
                <ConversationPage />
              </Lazy>
            ),
          },
        ],
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
      // `/lists` es el tablón y cada lista vive en su `slug`, igual que los
      // calendarios (RFC 0010 D3). La pública va fuera de este layout.
      {
        path: 'lists',
        element: (
          <RequirePermission permission="lists.view">
            <Lazy>
              <ListsPage />
            </Lazy>
          </RequirePermission>
        ),
      },
      {
        path: 'lists/:slug',
        element: (
          <RequirePermission permission="lists.view">
            <Lazy>
              <ListPage />
            </Lazy>
          </RequirePermission>
        ),
      },
      // `/tables` es el tablón y cada tabla vive en su `slug`, igual que
      // calendarios y listas (RFC 0021 D2).
      {
        path: 'tables',
        element: (
          <RequirePermission permission="tables.view">
            <Lazy>
              <TablesPage />
            </Lazy>
          </RequirePermission>
        ),
      },
      {
        path: 'tables/:slug',
        element: (
          <RequirePermission permission="tables.view">
            <Lazy>
              <TablePage />
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
        path: 'believers/ministries',
        element: (
          <RequirePermission permission="believers.manage">
            <Lazy>
              <MinistriesPage />
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
      // El cuaderno de la iglesia (RFC 0017) **sí** lleva `RequirePermission`,
      // al revés que profecías y sueños: es de la iglesia activa (D1, D10) y
      // no de cada usuario. `/journal/list` va declarada **antes** que
      // `/journal/:id`, por el mismo motivo que `/prophecies/list`.
      {
        path: 'journal',
        element: (
          <RequirePermission permission="journal.view">
            <Lazy>
              <JournalPage />
            </Lazy>
          </RequirePermission>
        ),
      },
      {
        path: 'journal/list',
        element: (
          <RequirePermission permission="journal.view">
            <Lazy>
              <JournalListPage />
            </Lazy>
          </RequirePermission>
        ),
      },
      {
        path: 'journal/:id',
        element: (
          <RequirePermission permission="journal.view">
            <Lazy>
              <JournalEntryPage />
            </Lazy>
          </RequirePermission>
        ),
      },
      // Tareas y hábitos (RFC 0018): tres pantallas, todas bajo `tasks.view`
      // (D7) — un solo permiso, no hay «lo ajeno» que gestionar (D6).
      {
        path: 'tasks',
        element: (
          <RequirePermission permission="tasks.view">
            <Lazy>
              <TasksPage />
            </Lazy>
          </RequirePermission>
        ),
      },
      {
        path: 'tasks/stats',
        element: (
          <RequirePermission permission="tasks.view">
            <Lazy>
              <TasksStatsPage />
            </Lazy>
          </RequirePermission>
        ),
      },
      {
        path: 'tasks/list',
        element: (
          <RequirePermission permission="tasks.view">
            <Lazy>
              <TasksListPage />
            </Lazy>
          </RequirePermission>
        ),
      },
      // Las profecías **no llevan `RequirePermission`**, y es a propósito (RFC
      // 0004 D2): son de cada usuario y no de la iglesia, así que exigir un
      // permiso de rol dejaría a alguien fuera de las suyas propias.
      //
      // `/prophecies/list` va declarada **antes** que `/prophecies/:id`: con el
      // orden al revés, «list» se resolvería como el identificador de una.
      {
        path: 'prophecies',
        element: (
          <Lazy>
            <PropheciesPage />
          </Lazy>
        ),
      },
      {
        path: 'prophecies/list',
        element: (
          <Lazy>
            <PropheciesListPage />
          </Lazy>
        ),
      },
      {
        path: 'prophecies/:id',
        element: (
          <Lazy>
            <ProphecyPage />
          </Lazy>
        ),
      },
      // Los sueños, igual: sin `RequirePermission` (RFC 0005 D2) y con `list`
      // declarada antes que `:id`, por el mismo motivo.
      {
        path: 'dreams',
        element: (
          <Lazy>
            <DreamsPage />
          </Lazy>
        ),
      },
      {
        path: 'dreams/list',
        element: (
          <Lazy>
            <DreamsListPage />
          </Lazy>
        ),
      },
      {
        path: 'dreams/:id',
        element: (
          <Lazy>
            <DreamPage />
          </Lazy>
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
      // El directorio de accesos vive en ajustes y no colgando de una lista,
      // porque un acceso es de la iglesia (RFC 0010 D19).
      {
        path: 'settings/access',
        element: (
          <RequirePermission permission="lists.share">
            <Lazy>
              <ListAccessPage />
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
