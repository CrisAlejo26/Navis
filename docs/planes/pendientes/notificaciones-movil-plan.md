# Notificaciones en la app móvil — plan de implementación

- **Estado**: Fases 0-5 implementadas para el **recordatorio de notas de
  creyentes** (primer aviso real) y **probadas en el emulador de Android el
  2026-09-30**: permiso (diálogo del sistema), aviso de prueba, recordatorio de
  una nota y su toque con la app en segundo plano y en primer plano. Al tocar
  el aviso se abre la **página de la nota** (`/believers/notes/[id]`), no el
  formulario. Falta decidir los demás avisos (§7).
- **Bug encontrado al probar**: en Android un permiso nunca pedido llega como
  `status: 'denied'` con `canAskAgain: true`; `resolvePermission` lo daba por
  denegado y el diálogo del sistema no salía nunca. Manda `canAskAgain`.
- **Fecha**: 2026-09-29
- **Referencia**: la app Dreamkeeper (`D:\Proyectos_personales\Dreamkeeper`),
  cuyo sistema se ha revisado entero (§1).
- **Depende de**: RFC 0024 (base SQLite local del móvil). Las RFC 0003, 0016,
  0017 y 0018 dejaron las notificaciones **fuera de alcance** por no haber
  `expo-notifications`: este plan es lo que las desbloquea.

## 1. Cómo lo hace Dreamkeeper

**No usa push remoto.** No hay servidor, ni tokens de Expo, ni FCM propio: todas
las notificaciones son **locales y programadas** en el propio teléfono con
`expo-notifications` (`scheduleNotificationAsync` con un trigger `DATE`). Encaja
con Navis, cuyo móvil ya es local-first.

| Pieza                     | Qué hace                                                                                                                                                                                                              | Fichero de Dreamkeeper                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Carga perezosa del módulo | `getNotifications()` devuelve `null` en Expo Go (`executionEnvironment === 'storeClient'`); nada revienta                                                                                                             | `utils/notifications/notifications-client.ts`                           |
| Manejador en primer plano | `setNotificationHandler`: banner + lista + sonido, sin badge                                                                                                                                                          | `utils/notifications/setup.ts`                                          |
| Canal de Android          | `setNotificationChannelAsync`, importancia `HIGH`, visibilidad pública. El id lleva versión (`…-v2`): **un canal no se puede modificar una vez creado**, así que para cambiar vibración o importancia se crea otro id | `setup.ts`, `hooks/use-app-initialization.ts`                           |
| Permiso                   | `getPermissionsAsync` / `requestPermissionsAsync`, reducido a `granted / denied / undetermined` (`canAskAgain === false` cuenta como denegado)                                                                        | `setup.ts`                                                              |
| **El modal del permiso**  | Es el diálogo **del sistema** (Android 13+ `POST_NOTIFICATIONS`, iOS). No lo pinta la app: aparece al llamar a `requestPermissionsAsync`, y solo **cuando el usuario activa el interruptor** en ajustes               | `components/settings/dream-reminders-master-item.tsx`                   |
| Interruptor de ajustes    | Al activar: pide permiso; si no lo dan, no se activa y se refresca el estado. Al desactivar: cancela todo lo programado                                                                                               | `hooks/use-dream-reminders.ts` (`toggleMaster`)                         |
| Banner de denegado        | Si el permiso está denegado, tarjeta con «Abrir ajustes» → `Linking.openSettings()`. **Re-comprueba el permiso con `AppState` al volver a primer plano**, o el banner sigue tras concederlo                           | `hooks/use-notification-permissions.ts`, `permission-denied-banner.tsx` |
| Botón de prueba           | Programa una notificación a 2 s para verificar que todo funciona                                                                                                                                                      | `utils/notifications/send-test-notification.ts`                         |
| Programar                 | Cancela la anterior de la misma entidad, calcula la fecha, programa, y guarda el `notification_id` del sistema en SQLite para poder cancelarla luego                                                                  | `schedule-reminder.ts`, `schedule-pastoral-reminder.ts`                 |
| Reprogramar al arrancar   | En cada arranque, con sesión y BD lista, se reprograma todo (el SO puede haber perdido alarmas: reinicio, ahorro de batería, actualización)                                                                           | `hooks/use-app-initialization.ts` → `rescheduleAll`                     |
| Al tocar la notificación  | `addNotificationResponseReceivedListener` + `getLastNotificationResponseAsync` (app cerrada) → `router.push` según `data.type`                                                                                        | `hooks/use-notification-tap-handler.ts`                                 |
| Historial / campana       | Tabla `notifications` en SQLite, insertada al programar (pendiente) y marcada «notificada» al recibirla; campana con badge y hoja con scroll infinito                                                                 | `database/services/notifications/`, `components/notification-bell/`     |
| Plugin de `app.json`      | `expo-notifications` con icono monocromo, color y `defaultChannel`; permiso `POST_NOTIFICATIONS` en el manifest                                                                                                       | `app.json`                                                              |

**Lo que aprendieron a base de errores** (y conviene copiar):

1. Una sola fila pendiente por entidad: reeditar **sustituye**, no acumula.
2. Fecha pasada ⇒ no se programa (`fireAt <= now` devuelve `null`).
3. Al reprogramar una inactividad ya vencida, se programa a `ahora + N días`
   para no disparar una avalancha.
4. Ningún fallo del módulo nativo rompe la pantalla: todo va en `try/catch` con
   `console.warn`.

**Lo que no se copia:** la tabla `reminders_scheduled` aparte (redundante con el
historial), `getNotifications()` como `require` dinámico en todo el código (basta
un adaptador; ver §3), y los hooks que mezclan programar con leer de BD.

## 2. Decisiones

> **Enmienda al implementar (D6/D7):** no hay tabla `scheduled_notifications`.
> El identificador de cada aviso del sistema **es** su clave estable
> (`navis:note-reminder:<id>`) y el propio sistema es la fuente de verdad de
> qué está programado (`getAllScheduledNotificationsAsync`). Programar con el
> mismo identificador sustituye el aviso. Menos piezas, sin migración y sin
> nada que se pueda desincronizar. La Fase 2 desaparece.

| #   | Decisión                                                                                                                                             | Motivo                                                                                                      |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| D1  | **Solo notificaciones locales.** Sin push remoto en esta entrega                                                                                     | El móvil es local-first (RFC 0024): no hay servidor al que pedirle que avise. Ver §8 para push              |
| D2  | El permiso se pide **al activar el interruptor de ajustes**, nunca al arrancar                                                                       | Pedirlo en frío tiene la tasa de rechazo más alta, y en Android un «no» dos veces es definitivo             |
| D3  | Además, se puede pedir **en contexto**: al guardar el primer recordatorio, con una hoja previa que explica para qué (después el diálogo del sistema) | Es el momento en que el usuario entiende el valor                                                           |
| D4  | Patrón **adaptador de plataforma** (Regla 1): `NotificationScheduler` con una implementación real y un doble en memoria para los tests               | Jest no puede llamar al módulo nativo; inyectar vale más que mockear                                        |
| D5  | Un **canal de Android por tipo** de aviso, desde el principio, con id versionado                                                                     | El usuario podrá silenciar «tareas» y dejar «recordatorios de notas». No se puede añadir después sin migrar |
| D6  | Los avisos se guardan en una tabla local `scheduled_notifications` (clave estable → `notification_id` del SO)                                        | Sin ella no se puede cancelar ni sustituir; es lo que Dreamkeeper guarda en dos tablas                      |
| D7  | La tabla **no** existe en el servidor: es solo del móvil y no entra en el test de paridad con TypeORM                                                | Es estado de programación del dispositivo, no dato de negocio                                               |
| D8  | Historial y campana: **fase aparte y opcional** (Fase 6)                                                                                             | Es un centro de notificaciones entero; el motor vale sin él                                                 |

## 3. Arquitectura

Todo en `apps/mobile/src`, sin tocar `packages/` salvo la tabla local.

```
lib/notifications/
  scheduler.ts             interfaz NotificationScheduler (la frontera) y tipos
  expo-scheduler.ts        implementación con expo-notifications; null-safe en Expo Go
  channels.ts              ids y definición de los canales de Android (versionados)
  permission.ts            getStatus / request → 'granted' | 'denied' | 'undetermined'
  handler.ts               setNotificationHandler (primer plano)
  routes.ts                data.type → ruta de expo-router (una unión cerrada)
data/repos/
  scheduled-notifications-repo.ts    clave → notification_id, upsert, borrar por clave/tipo
hooks/
  use-notification-permission.ts     estado + request + AppState + openSettings
  use-notification-tap.ts            respuesta al toque, con app abierta y cerrada
  use-notification-sync.ts           reprogramación al arrancar y al cambiar ajustes
stores/notification-settings.ts      interruptor maestro y uno por tipo (persistido)
components/settings/
  notifications-card.tsx             la tarjeta de ajustes (§4)
  permission-denied-notice.tsx       aviso + «Abrir ajustes»
```

Reglas del diseño:

- **Cada módulo aporta un «proveedor»**: una función pura
  `(datos) → AvisoPlanificado[]` (clave, fecha, título, cuerpo, ruta). El motor
  no sabe qué es una nota o una tarea. Es el patrón «contrato único» de la
  Regla 1: añadir un tipo de aviso = escribir un proveedor y su canal.
- `sincronizar(proveedores)` calcula lo deseado, lo compara con
  `scheduled_notifications` y **solo** cancela lo sobrante y programa lo que
  falta. Idempotente: se puede llamar en cada arranque, cada cambio de ajuste y
  cada vez que se guarda algo.
- **Claves estables** (`note-reminder:<id>`): garantizan «una fila por entidad»
  sin lógica extra.
- El SO tiene un **tope de alarmas** (iOS: 64 pendientes; Android varía por
  fabricante). El motor programa solo las **N más próximas** (N = 50) y el resto
  entra en la siguiente sincronización.
- Ningún fichero pasa de ~100 líneas (Regla 6); ningún `any` (Regla 10): el
  `data` de la notificación llega como `unknown` y se valida con un esquema zod
  antes de navegar.

## 4. Interfaz

**Ajustes** (`app/(tabs)/settings.tsx`) gana la tarjeta «Notificaciones»:

1. Interruptor maestro. Al activarlo: pide permiso → si lo dan, sincroniza; si
   no, vuelve a apagado y aparece el aviso de denegado.
2. Un interruptor por tipo de aviso (se rellena según §7), deshabilitados si el
   maestro está apagado.
3. Aviso de denegado con botón «Abrir ajustes» (mín. 44 px, Regla 5). Vuelve a
   comprobar el permiso al regresar a primer plano.
4. Botón «Enviar una de prueba» (aviso a 2 s): la forma de verificar en un
   dispositivo real y de que el usuario compruebe que le llegan.

**Firma de la pantalla** (Regla 9): el interruptor maestro es un **faro** — al
activarse, el icono de faro de la tarjeta emite un pulso de luz una vez
(`opacity` + `transform`, respeta `reduced-motion`). Coherente con «El Faro» de
tareas y hábitos. Sin degradados, sin emoji, y sin iconos de adorno.

**Copia** (Regla 9 §6), en presente y diciendo qué pasa: «Navis te avisa a la
hora que elijas, aunque la app esté cerrada.» Los avisos de la propia
notificación son frases cortas y concretas («Visitar a Marta — hoy 18:00»), no
«¡Tienes un recordatorio!».

Todos los textos: sección nueva `notifications.*` en los **seis idiomas**
(Regla 2), sin claves construidas al vuelo.

## 5. Configuración nativa

- `app.config.ts`: añadir el plugin `expo-notifications` con `icon` (SVG→PNG
  monocromo del barco, **generado por `pnpm icons`**, nunca a mano: hay que
  añadirlo a `DESTINOS` de `scripts/gen-icons.mjs`), `color: '#2140cf'` (el
  `--brand`, que no cambia con el tema) y `defaultChannel`.
- El plugin añade `POST_NOTIFICATIONS` al manifest solo. **No se toca
  `AndroidManifest.xml`**: Expo gestionado lo regenera.
- **Expo Go no vale** para probar: desde SDK 53 las notificaciones no funcionan
  ahí. Hace falta un _development build_ (`expo run:android`). Ya hay carpeta
  `prebuild`, así que es viable; **hay que avisarlo al usuario**.
- iOS no tiene hoy configuración de notificaciones propia; con el plugin basta
  (sin APNs remoto porque no hay push).
- Añadir `expo-notifications` con `npx expo install` para que salga la versión
  del SDK 57, y mock en `jest.setup.js`.
- `expo-doctor` debe seguir limpio (Regla 4 §2).

## 6. Fases

Una a la vez y con visto bueno, como el plan de componentes móviles.

| Fase | Contenido                                                                                                                                                            | Verificación                                                                              |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 0    | `expo install expo-notifications`, plugin y icono en `app.config.ts`/`gen-icons`, mock de Jest, `pnpm icons` + `pnpm test:scripts`, `expo-doctor`                    | `pnpm check`, `expo-doctor`, build de desarrollo arranca                                  |
| 1    | Adaptador `NotificationScheduler` + doble en memoria; canales; permiso; `handler`; tests unitarios del adaptador y de `resolve permission`                           | Tests; `getStatus` en Expo Go devuelve `undetermined` sin reventar                        |
| 2    | Tabla local `scheduled_notifications` (esquema en `local-schema.ts`, migración versionada en `data/db.ts`, **añadir a `ALL_TABLES` de `test-support.js`**) y su repo | Tests del repo; migración desde una BD ya existente                                       |
| 3    | Motor `sincronizar` (diff, tope de N, fecha pasada) + `use-notification-sync` al arrancar + reprogramación al guardar                                                | Tests de diff (nuevo, cambiado, borrado, vencido); en dispositivo, cerrar y reabrir       |
| 4    | Tarjeta de ajustes, interruptor maestro, aviso de denegado con `AppState`, botón de prueba, textos en seis idiomas                                                   | En dispositivo Android: pide permiso, deniega, «Abrir ajustes», concede, prueba llega     |
| 5    | **Primer tipo de aviso real** (según §7): proveedor + canal + ruta al tocar (`use-notification-tap`, app abierta y cerrada)                                          | Programar a 1-2 min, tocar con la app en 3 estados (primer plano, segundo plano, cerrada) |
| 6    | (Opcional) tabla de historial + campana con badge + hoja con scroll infinito                                                                                         | Como la fase equivalente de Dreamkeeper                                                   |

Cada fase cierra con `pnpm check`; de la 4 en adelante, con la comprobación
visual en dos temas, 375 px y alemán (Reglas 2, 3, 5 y 11).

## 7. Qué avisar: lo que ya existe y lo que falta

Candidatos, según lo que **ya hay en la base local**, para que el usuario
decida:

| Candidato                                   | Fecha de la que sale                                  | Estado del dato en el móvil                   | Coste                                          |
| ------------------------------------------- | ----------------------------------------------------- | --------------------------------------------- | ---------------------------------------------- |
| Recordatorio de una nota de hermano         | `believer_notes.remind_at` + `remind_text`            | **Ya existe** (RFC 0003)                      | Bajo: es el caso de Dreamkeeper casi literal   |
| «Este hermano lleva N días sin visita»      | Última nota + N días (configurable por hermano)       | Falta el campo de días y su ajuste            | Medio                                          |
| Te toca predicar / servir (calendario)      | Asignaciones del calendario (RFC 0002)                | **Ya existe** en local                        | Medio: hora de aviso (víspera, mañana del día) |
| Tareas y hábitos                            | Fecha de la tarea, hora del hábito (RFC 0018)         | Pendiente en móvil (`tasks.tsx` es un puente) | Depende de implementar antes la sección        |
| Recordatorio de nota de iglesia (cuaderno)  | `remind_at` de RFC 0017                               | Pendiente en móvil                            | Igual que la anterior                          |
| Sueños: revisar uno pasado un tiempo        | `dreams.created_at` + hitos (lo que hace Dreamkeeper) | **Ya existe** en local                        | Medio: hitos configurables                     |
| Profecías: revisar una profecía sin cumplir | Fecha de la profecía + hitos                          | **Ya existe** en local                        | Medio                                          |
| Resumen semanal                             | Reloj (un aviso repetido semanal)                     | —                                             | Bajo; con trigger `WEEKLY`                     |

**Lo que hace falta que digas**: de esta lista, cuáles quieres y, para cada una,
**cuándo** debe sonar (a la hora exacta que fija el usuario, la víspera, un
tiempo antes) y **con qué tono** (una sola persona, ¿o algo que pueda molestar
poco?). Con eso, la Fase 5 se convierte en una fase por tipo.

## 8. Fuera de alcance (y por qué)

- **Push remoto** (avisar de un mensaje del chat, RFC 0016, o de que alguien te
  asigna algo). Requiere cuenta de Expo/FCM, guardar tokens por dispositivo en
  la API, un emisor en el servidor y APNs para iOS. Es otro plan, y solo tiene
  sentido cuando el móvil hable con la API en vez de con su base local. Si
  alguno de los avisos que elijas en §7 es de tipo «otra persona hizo algo»,
  **hay que decirlo ya**, porque cambia el alcance.
- **Notificaciones en web/escritorio** (Web Push, Tauri). Solo móvil.
- **Acciones en la propia notificación** («Hecho», «Posponer»). Se pueden añadir
  después con categorías (Dreamkeeper solo tiene «Ver»); no son necesarias para
  la primera entrega.

## 9. Riesgos y qué queda sin probar aquí

- **No se puede verificar en este entorno**: el permiso, el canal, la llegada
  con la app cerrada y el toque necesitan un dispositivo Android (y otro iOS
  para el segundo sistema). La Regla 11 exige que se vea funcionar: el plan
  deja cada fase con su prueba manual concreta, y las fases 4 y 5 **no se dan
  por cerradas sin la confirmación del usuario**.
- **Ahorro de batería de los fabricantes** (Xiaomi, Huawei, Samsung) mata las
  alarmas de apps cerradas. Dreamkeeper lo mitiga reprogramando al arrancar; aquí
  igual, y se documenta en el aviso de ajustes si hace falta.
- **Zona horaria y cambio de hora**: los `DATE` son instantes absolutos. Si el
  aviso es «a las 09:00 de mi día», se calcula con los getters locales (trampa
  de `iso-day.ts`, `CLAUDE.md`), no con `toISOString().slice(0, 10)`.
- **Idioma**: el texto de una notificación programada se **congela** al
  programar. Si el usuario cambia de idioma, hay que reprogramar (la
  sincronización ya lo hace, si el título forma parte de la comparación).
