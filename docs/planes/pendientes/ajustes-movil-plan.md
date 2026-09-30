# Ajustes en la app móvil — plan de reorganización

- **Estado**: Fases 0-4 implementadas y recorridas en el emulador (2026-09-30);
  quedan la 5 (seguridad) y la 6 (conexión), que dependen del RFC 0024. Decisiones
  tomadas: D1 concentrador con subpantallas; D2 «Solo desarrollo» visible siempre
  (la bienvenida ofrece entrar con datos de prueba); D5 en local siempre se puede
  editar la iglesia. La pantalla sigue el estilo de Taskia (tarjetas redondeadas
  sin borde, filas con icono tintado, tema en píldora). La copia de seguridad es
  un JSON versionado que solo restaura en el mismo teléfono (la contraseña local
  depende de una clave del aparato).
- **Fecha**: 2026-09-30
- **Apps afectadas**: mobile (y `packages/i18n`; `packages/shared` solo si se
  reutilizan esquemas de perfil e iglesia)
- **Referencias**: la pantalla de ajustes de la web (`apps/web/src/routes/settings.tsx`),
  las apps hermanas **Taskia** (`D:\Proyectos_personales\taskia\mobile`) y
  **Recopila** (`D:\Proyectos_personales\recopila`), y el RFC 0024 (login
  completo: PIN, huella y conexión al servidor).
- **Depende de**: RFC 0024 (Fases 2-4 para seguridad y conexión),
  `notificaciones-movil-plan.md` (§7, los avisos que faltan).

> **Sobre Refero.** Las herramientas del MCP de Refero **no estaban conectadas
> en la sesión** en que se escribió este plan, así que no hay pantallas de
> Refero citadas. Lo que hay es lo revisado en el código de las tres apps. La
> lista de búsquedas para cuando se conecte está en §9; conviene pasarla antes
> de dar por cerrado el diseño visual de la Fase 0.

---

## 1. Qué hay hoy y qué falla

`apps/mobile/app/(tabs)/settings.tsx` es **una sola columna de tarjetas** que ha
ido creciendo por capas:

| Bloque actual           | Qué es                                             | Problema                                                       |
| ----------------------- | -------------------------------------------------- | -------------------------------------------------------------- |
| Apariencia              | Tema (3 opciones) + selector de idioma en línea    | Bien, pero el selector de seis idiomas ocupa media pantalla    |
| Notificaciones          | Maestro + recordatorio de notas + prueba + permiso | Crecerá con cada tipo de aviso (§7 del plan de notificaciones) |
| Perfil                  | Solo el correo y «Cerrar sesión»                   | No es un perfil: no se ve ni se edita nada                     |
| Conexión                | Una frase: «Modo local»                            | Marcador de sitio; es donde vivirá el RFC 0024 F3-4            |
| Datos de prueba         | Botón de sembrar (desaparece si ya hay datos)      | Herramienta de desarrollo mezclada con ajustes de usuario      |
| Catálogo de componentes | Fila que abre `/components`                        | Ídem: es de desarrollo                                         |

Y lo que **no está** y la web sí tiene, o el móvil ya guarda pero no ofrece:

- **Datos de la iglesia** (nombre, ciudad, país, zona horaria): en la web es la
  primera sección (`ChurchSettings`); en el móvil la iglesia solo se ve al
  crearla (`church-setup`) y no se puede editar.
- **Perfil** (teléfono, ciudad, biografía, zona horaria): la web lo edita con
  `ProfileForm`; el móvil no tiene ni las columnas.
- **Configuración del calendario** (reuniones fijas y sedes): existe en
  `app/calendar/settings.tsx` pero solo se llega desde el propio calendario.
- **Catálogo de creyentes** (`believers/catalog`): ídem, escondido.
- **Seguridad** (PIN, huella, cambiar contraseña) y **Conexión**: definidos en
  el RFC 0024, sin sitio donde vivir.
- **Sacar los datos del teléfono**: en local, el teléfono es la única copia y no
  hay copia de seguridad. La web tiene exportación (RFC 0009).
- **Acerca de**: versión de la app.

## 2. Qué se copia de cada referencia

| Idea                                                                        | De                | Cómo se adapta a Navis                                                                                                                |
| --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Concentrador con grupos etiquetados** en mayúsculas (`SettingGroup`)      | Taskia            | Grupos con etiqueta y una tarjeta de filas (`CardGroup` + `ListRow`, que **ya existen**); cada apartado grande es una pantalla propia |
| **Tarjeta de cuenta arriba**: avatar con iniciales, nombre, dato secundario | Recopila          | Avatar (`ui/avatar` ya existe) + nombre + correo + iglesia; pulsarla abre «Mi perfil»                                                 |
| **Tema como fichas segmentadas** y **idioma como fila que abre una hoja**   | Recopila / Taskia | El tema queda en línea (`SegmentedControl`); el idioma pasa a una fila con el idioma actual que abre `BottomSheet`                    |
| **Pantalla de notificaciones aparte**: maestro, tipos, horas y prueba       | Taskia            | Subpantalla «Avisos» con maestro → tipos → «No molestar» → prueba; la franja de silencio se añade cuando haya más de un tipo          |
| **Fila de ajuste con interruptor**, icono de color y subtítulo              | Taskia            | `ListRow` con `Switch` a la derecha; el icono de color lo decide el tema (Regla 3), no un hexadecimal                                 |
| **Huella como fila solo si el hardware la soporta**                         | Recopila          | Igual, en «Seguridad», y coherente con el RFC 0024 F2                                                                                 |
| **Cerrar sesión: botón destructivo suelto, con confirmación**               | Recopila          | Botón `danger` fuera de las tarjetas, al final, con diálogo (hoy cierra sin preguntar)                                                |
| **Datos: exportar/importar como filas con chevron**                         | Recopila          | «Exportar copia» y «Restaurar copia» en el grupo Datos                                                                                |
| **Orden de fuera hacia dentro**: iglesia → tú → este aparato                | La web            | El mismo orden en el móvil, con las mismas etiquetas de alcance (`settings.scope*`)                                                   |

Lo que **no** se copia: el fondo de aurora y la cabecera de forma de Recopila
(es su firma, no la de Navis; Regla 9), ni los estilos de Taskia (`ink`,
`card`): Navis usa sus tokens.

## 3. Estructura propuesta

Un **concentrador** (`app/(tabs)/settings.tsx`) y **subpantallas** en
`app/settings/…`, como ya hacen `calendar/settings` o `believers/catalog`. El
concentrador es corto (una pantalla y poco más de scroll) y **no contiene
formularios**: cada formulario vive en su pantalla, con `AppBar` y botón de
volver.

```
Ajustes
├─ [Tarjeta de cuenta]  Avatar · Nombre · correo · «Iglesia del Sur»         → Mi perfil
│
├─ LA IGLESIA                                        (alcance: toda la iglesia)
│    Datos de la iglesia        nombre, ciudad, país, zona horaria           → settings/church
│    Calendario                 reuniones fijas y sedes                      → calendar/settings   (ya existe)
│    Catálogo de creyentes      etiquetas, estados, orígenes                 → believers/catalog   (ya existe)
│
├─ TÚ                                                (alcance: solo tú)
│    Mi perfil                  nombre, teléfono, ciudad, bio, zona horaria  → settings/profile
│    Seguridad                  PIN, huella, cambiar contraseña              → settings/security   (RFC 0024 F2)
│
├─ ESTE APARATO                                      (alcance: este teléfono)
│    Tema           [ Claro | Oscuro | Sistema ]     en línea
│    Idioma         Español ›                        → hoja de idiomas
│    Avisos         Activados ›                      → settings/notifications
│
├─ DATOS
│    Exportar copia de seguridad                                             → settings/backup
│    Restaurar una copia                                                     → settings/backup
│    Conexión       Modo local ›                     → settings/connection (RFC 0024 F3-4)
│
├─ ACERCA DE
│    Versión 1.0.0 (compilación N)
│
├─ [ Cerrar sesión ]                   botón destructivo, con confirmación
│
└─ SOLO DESARROLLO  (visible según la decisión D2)
     Datos de prueba · Catálogo de componentes
```

**Por qué este corte**: el orden y las etiquetas son los de la web (que ya
decidió que lo que más se busca va arriba y lo que se toca una vez va abajo),
y los grupos coinciden con quién se ve afectado por el cambio. Un cambio en
«La iglesia» lo ve toda la congregación; en «Este aparato», solo quien lo hace.

**Sin iglesia activa** (entre el registro y `church-setup`) el grupo «La
iglesia» no sale, igual que en la web: mejor que un bloque que no se puede
rellenar.

**Lo de la web que no se lleva**: «Qué ves en la administración» (alcance de
superadministrador, RFC 0014) y la gestión de usuarios y roles. En modo local
solo hay una cuenta y no hay superadministrador. Aparecen con la Fase 3 del
RFC 0024, cuando haya servidor; entonces se añade el grupo a este mismo
concentrador.

## 4. Paridad con la web

| Ajuste de la web                    | Móvil hoy                     | Con este plan                                                       |
| ----------------------------------- | ----------------------------- | ------------------------------------------------------------------- |
| Ficha de la iglesia                 | No se edita                   | `settings/church` (Fase 1)                                          |
| Mi perfil (contacto y zona horaria) | No existe                     | `settings/profile` (Fase 1)                                         |
| Apariencia: tema e idioma           | Sí                            | Se conserva; el idioma pasa a hoja (Fase 0)                         |
| Ámbito del superadministrador       | No aplica en local            | Fuera hasta el RFC 0024 F3                                          |
| Exportar listados (RFC 0009)        | No                            | No se replica el listado; se ofrece **copia de seguridad** (Fase 4) |
| Cambiar contraseña de la cuenta     | No (solo recuperar, RFC 0023) | `settings/security` (Fase 5)                                        |

Regla de paridad de datos (RFC 0024): los campos locales tienen **los mismos
nombres y tipos** que las entidades de TypeORM. Perfil y iglesia añaden columnas
al SQLite local y **hay que comprobarlas contra la entidad** con el mismo test
de paridad que ya existe para el resto
(`apps/api/src/database/local-schema.parity.test.ts`).

## 5. Fases

Cada fase es entregable por separado y deja la app funcionando. **Una fase cada
vez y solo con permiso explícito.**

### Fase 0 — Concentrador y componentes (sin funcionalidad nueva)

- Reorganizar `settings.tsx` en los grupos de §3, moviendo lo que ya existe:
  tema, idioma, avisos, cerrar sesión, conexión (fila informativa), demo y
  catálogo.
- Componentes nuevos, **cada uno en su fichero y ≤100 líneas** (Regla 6):
    - `settings/account-card.tsx` — avatar, nombre, correo, iglesia.
    - `settings/settings-group.tsx` — etiqueta en mayúsculas + `CardGroup`.
    - `settings/language-sheet.tsx` — hoja de idiomas (sobre `BottomSheet`).
    - `settings/sign-out-button.tsx` — botón `danger` + confirmación.
- Rutas nuevas como pantallas puente vacías **solo si** la fase siguiente las
  necesita; no se dejan enlaces a pantallas que no existen.
- Registrar las subpantallas en `app/_layout.tsx` con
  `animation: PUSHED_SCREEN_ANIMATION` y `headerShown: false` (llevan su `AppBar`).
- Claves nuevas en `settings.*` (`group…`, `signOutConfirm…`, `about`, `version`)
  **en los seis idiomas**, sin claves construidas al vuelo: una unión de claves
  como `NavKey` (Regla 2 §3).

### Fase 1 — Iglesia y perfil (paridad con la web)

- **Migración SQLite** (en los dos motores no aplica: el móvil es solo SQLite;
  se prueba en emulador): `users` gana `phone`, `city`, `bio`, `timezone`;
  `churches` gana `country`. Nullables, sin romper los datos existentes.
- Repos: `updateProfile` en `account-repo`, `updateChurch` en `church-repo`, con
  sus tests. La validación reutiliza los esquemas zod de `packages/shared` en
  lugar de escribir otros (Regla 1).
- Pantallas `settings/church` y `settings/profile`, con formularios dentro de
  `KeyboardAvoidingView` + `ScrollView` (Regla 5 §5). El país necesita
  un selector: el de la web (`selector-geografico-plan.md`) no existe en el
  móvil, así que se decide si se sube la lista de países a `packages/shared`
  (dos usos: se extrae) o, como mínimo, se reutiliza el `Select` de `ui/`.
- La zona horaria de la iglesia **manda en el calendario**: al cambiarla hay que
  invalidar las consultas del calendario y de los avisos programados, o los
  recordatorios saldrán a la hora vieja. Es el punto delicado de la fase.

### Fase 2 — Avisos como subpantalla

- Mover `NotificationsCard` a `settings/notifications` y dejar en el
  concentrador la fila con el estado («Activados», «Desactivados», «Sin
  permiso»).
- Estructura de la pantalla, como Taskia: **permiso maestro → tipos → «No
  molestar» → prueba**. Hoy solo hay un tipo (recordatorio de notas); la franja
  de silencio y la hora del resumen se añaden **cuando existan los avisos que
  las usen** (`notificaciones-movil-plan.md` §7), no antes (Regla 1 §4:
  abstraer por si acaso).
- Se conserva el bloque de «permiso denegado → abrir ajustes del sistema».

### Fase 3 — Idioma en hoja y acerca de

- Sustituir el selector en línea por la fila + `language-sheet`. Cada idioma va
  en su propio idioma (`LOCALE_LABELS`), como ya establece la Regla 2 §6.
- «Acerca de»: versión y número de compilación desde `expo-constants` (ya es
  dependencia). Nada de enlaces a sitios que no existen todavía.

### Fase 4 — Copia de seguridad

- **Exportar**: volcar la base SQLite y los audios a un único fichero y
  compartirlo con `expo-sharing` (ya instalado), guardando antes con
  `expo-file-system`.
- **Restaurar**: elegir el fichero, validar que es una copia de Navis y de una
  versión compatible **antes** de tocar nada, y reemplazar. Con confirmación
  explícita y aviso de que sustituye lo que hay.
- **Trampa conocida**: los audios de las notas viven en disco, no en la base
  (`CLAUDE.md`, «Los ficheros subidos no están en la base de datos»). Una copia
  que solo lleve el `.db` pierde los audios sin avisar; la copia tiene que
  incluir esa carpeta o decir claramente que no lo hace.
- Es la fase con más riesgo y menos verificable aquí (sistema de ficheros y hoja
  de compartir del teléfono): se dice qué queda sin probar (Regla 11 §1).

### Fase 5 — Seguridad (depende del RFC 0024 F2)

- `settings/security`: activar/desactivar PIN, cambiarlo, activar la huella (solo
  si `hasHardwareAsync() && isEnrolledAsync()`) y **cambiar la contraseña**
  local, que hoy no se puede.
- Cinco intentos de PIN fallidos → se olvida el acceso rápido (regla del RFC).
- No se guarda nada biométrico: el sistema operativo guarda las huellas.

### Fase 6 — Conexión (depende del RFC 0024 F3-4)

- La fila «Conexión» pasa de informativa a real: estado, «Conectar a un
  servidor» (URL comprobada con `GET /health`), «Desconectar» con la
  explicación de qué va a pasar.
- Al conectar, aparecen en este mismo concentrador los grupos que hoy no aplican
  (alcance de superadministrador, usuarios y roles según permisos).

## 6. Reglas del proyecto que este plan toca

- **Regla 1**: `CardGroup`, `ListRow`, `Switch`, `SegmentedControl`, `Avatar`,
  `BottomSheet`, `AppBar` ya existen; **no se crean equivalentes**. Lo nuevo son
  cuatro componentes de ajustes, no un sistema.
- **Regla 2**: seis idiomas en cada clave, con el alemán como prueba de ancho
  (las filas con valor a la derecha —«Idioma · Español»— son donde se rompen).
- **Regla 3**: iconos y fondos por token; el color de un icono de fila sale de
  `themeColorsHex`, no de un hexadecimal a ojo. Foco visible y estados
  (pulsado, deshabilitado) revisados en oscuro.
- **Regla 5**: objetivos ≥44 px, la acción principal al alcance del pulgar,
  formularios con teclado. Recuerda que la hoja de idiomas hereda la solución
  del teclado de `BottomSheet`.
- **Regla 6**: `settings.tsx` hoy tiene 115 líneas; el concentrador nuevo tiene
  que **bajar**, no crecer. Cada grupo, en su componente.
- **Regla 7**: ningún icono que se lea como cruz (cuidado con «cerrar» y con el
  «+» de añadir).
- **Regla 9**: no es una pantalla de plantilla. Elemento firma **uno**: la
  tarjeta de cuenta con la iglesia como «puerto» (el barco en su matrícula), no
  un degradado ni un icono por fila para rellenar. Copia con voz de Navis
  («Tu iglesia, tu teléfono»), no «Gestiona tus preferencias».
- **Regla 10**: sin `any`; lo que entra de un fichero de copia se valida con zod
  antes de usarlo; lo que devuelve `queryRunner.query` se comprueba.
- **Regla 11**: cada fase se recorre en el emulador, en claro y oscuro, en un
  ancho estrecho y con el idioma más largo; con los estados vacío, de carga y de
  error.

## 7. Decisiones que tiene que tomar el usuario

- **D1 — Concentrador con subpantallas o una sola pantalla con secciones.**
  Recomendado: concentrador (es lo que hacen Taskia y Recopila, y con ocho
  apartados una sola columna vuelve a ser la lista larga de hoy). Alternativa:
  una pantalla larga con las secciones de §3 sin subpantallas, más rápida pero
  que no escala.
- **D2 — Qué pasa con «Datos de prueba» y el «Catálogo de componentes».**
  Opciones: (a) grupo «Solo desarrollo» visible solo con `__DEV__`; (b) visible
  siempre, como ahora; (c) oculto salvo tocando siete veces la versión. Ojo: la
  pantalla de bienvenida tiene «Entrar con datos de prueba», así que hoy es un
  flujo que un usuario **sí** ve. Recomendado (a) si ese botón desaparece de las
  compilaciones de producción, y (b) mientras no.
- **D3 — Alcance de la copia de seguridad.** ¿Solo un fichero para guardar y
  restaurar en este teléfono, o también pensada para pasar los datos a otro
  teléfono? Lo segundo obliga a versionar el formato y a probar restaurar entre
  dispositivos.
- **D4 — Orden de las fases.** Recomendado: 0 → 1 → 2 → 3 → 4, y dejar 5 y 6 con
  el RFC 0024. Si el usuario prefiere la copia de seguridad antes que el perfil,
  la 4 no depende de las anteriores salvo la 0.
- **D5 — ¿Editar la iglesia en local lo puede hacer cualquiera?** En la web solo
  quien tiene `churches.manage`. En local hay una sola cuenta y es la dueña; se
  propone que siempre pueda, y que el permiso vuelva a mirarse al conectar.

## 8. Cómo se comprueba cada fase

- `pnpm --filter @navis/i18n build` y `pnpm --filter @navis/theme build` antes
  de fiarse de `typecheck` o de los tests (trampa documentada en `CLAUDE.md`).
- `pnpm check`, y `expo-doctor` si se toca configuración nativa.
- Tests: repos nuevos (perfil, iglesia) con el caso normal y los límites
  (vacío, zona horaria inválida, país desconocido); el concentrador comprueba
  **comportamiento** (aparece «La iglesia» solo con iglesia activa; la huella
  solo si hay hardware), no estilos. Los mocks de Reanimated de `jest.setup.js`
  pueden pedir una función más si aparece una animación nueva.
- Emulador: recorrer el concentrador y cada subpantalla, con el teclado abierto
  en los formularios, en claro y oscuro, en alemán y con la fuente grande del
  sistema; comprobar que no hay dos cabeceras ni dos flechas de volver.
- Lo que no se puede probar aquí (biometría en emulador, hoja de compartir,
  restaurar entre teléfonos) se dice explícitamente al terminar, con cómo
  probarlo.

## 9. Búsquedas pendientes en Refero

Para pasar cuando el MCP esté conectado (pantallas y flujos, no estilos: los
estilos de Refero cubren páginas web de marketing, no ajustes de app):

- «settings screen» en iOS y Android, con perfil arriba y grupos de filas.
- «account settings» con cuenta, iglesia/organización y cambio de contraseña.
- «security settings» con PIN y huella; «app lock».
- «notification settings» con maestro, tipos y horas de silencio.
- «backup and restore» / «export data» y su confirmación destructiva.
- «language picker» en hoja y «theme picker» segmentado.
- Flujos: «sign out confirmation», «connect to server», «restore from backup».

Lo que se busca en ellas: cómo se resuelve el **estado del ajuste en la fila**
(«Activados», «Español»), dónde va el botón destructivo y cuánta jerarquía
visual tiene una tarjeta de cuenta que no sea un avatar y un nombre.
