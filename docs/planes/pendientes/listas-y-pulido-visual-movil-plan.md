# Plan — Listas y pulido visual en la app móvil de Navis

Fecha: 2026-10-02. Estado: **implementación local realizada; publicación remota pendiente de decisión**.
Aplicación destinataria: `D:/Proyectos_personales/Navis/apps/mobile`.

## 1. Punto de reanudación y alcance confirmado

Este es el plan vigente para continuar en otra sesión. El usuario ha confirmado:

- Los cambios se hacen en **la app móvil de Navis**.
- Primero se cuidan pequeños detalles visuales: sombras del mismo color del botón y acabados coherentes en otros elementos.
- Después se implementa **Listas de Navis**, con las opciones, botones y configuraciones de la web de Navis.
- **Tomtask/Taskia es únicamente una referencia visual**, especialmente para las sombras cromáticas y la sensación de interfaz cuidada.
- Web y móvil deben funcionar de forma independiente. Conservar los mismos modelos de datos y columnas de base de datos; esto no significa conectar ni sincronizar automáticamente las aplicaciones.

### Corrección de la sesión anterior

Se interpretó mal la ruta de referencia y se empezó a modificar Taskia. **Todos los cambios de esa tarea se han deshecho**, incluidos los archivos nuevos y el plan colocado allí. Se comprobó `rtk git status --short` en Taskia y quedó limpio.

**No trasladar ese código ni su progreso a Navis.** No están implementados aquí los tokens, filtros ni pantallas descritos en el documento anterior. Tampoco pertenecen a este trabajo las vistas de tareas Lista/Kanban/Calendario/Tabla: Listas de Navis es un conjunto ordenado de personas de una iglesia.

Al preparar este documento, Navis estaba limpio. El único cambio previsto en esta sesión es este plan. No se han modificado código móvil, web, API, base de datos ni dependencias de Navis.

## 2. Estado real de Navis revisado

| Área               | Evidencia                                                                                                  | Consecuencia                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Ruta móvil         | `apps/mobile/app/lists.tsx` renderiza `PlaceholderScreen`                                                  | Sustituirla por la pantalla real; el acceso de navegación ya tiene un destino.                                     |
| Portada web        | `apps/web/src/routes/lists.tsx`                                                                            | Tablón de listas activas con paneles de su color, personas, iniciales, visibilidad y actividad cuando corresponde. |
| Detalle web        | `apps/web/src/routes/list.tsx`                                                                             | Cabecera coloreada y pestañas Personas, Estadísticas y Compartir.                                                  |
| Primitivos móviles | `apps/mobile/src/components/ui/button.tsx`, `lib/ui/button-variants.ts` y plan de componentes implementado | Ampliar los componentes existentes, sin construir otro sistema de UI.                                              |
| Identidad          | `.claude/rules/07-identidad-visual.md`, `packages/theme`                                                   | Navis conserva barco, azul de marca y tokens de control; no adoptar logo, Poppins ni paleta de Tomtask.            |
| Persistencia móvil | `apps/mobile/src/data/db.ts`, `local-db.ts`, repositorios de otras funciones                               | Expo SQLite y repositorios locales. La versión observada del esquema es 11; verificarla de nuevo al implementar.   |
| Dominio Listas     | Entidades de `apps/api/src/lists/` y esquemas de `packages/shared/src/schemas/list*.ts`                    | Son la referencia del modelo y de las columnas, no una orden de invocar los endpoints de la API desde móvil.       |

No se encontraron tablas de Listas en las migraciones locales revisadas ni repositorios móviles de Listas. Confirmarlo antes de crear la migración, por si otra sesión los añade.

Navis usa Expo 57, React Native 0.86, NativeWind 5, TanStack Query, componentes y tokens propios. El móvil carga Roboto actualmente; conservar su tipografía. Los paquetes internos de Navis ya existen: consumir tipos, validadores y tokens puros compatibles con su arquitectura no conecta datos en ejecución. No importar componentes web ni usar código de Taskia.

## 3. Dirección de diseño

Se aplica la metodología de la habilidad **Refero**, ya consultada en esta conversación. Su MCP no está disponible en esta sesión; no afirmar que se han visto capturas en Refero.

Referencias principales:

1. **Navis actual:** su marca y el plan `docs/planes/implementados/sistema-componentes-movil-plan.md` mandan en tipografía, colores, variantes e interacción. Ese plan documenta referencias como Perplexity y ChatGPT para calma visual y jerarquía; son antecedentes del documento, no investigación visual nueva de esta sesión.
2. **Tomtask local:** se revisaron `mobile/src/components/ui/button.tsx`, `constants/shadows.ts` y su especificación. La referencia útil es la profundidad cromática de acciones y FAB. Adaptar ese acabado a los colores y tamaños de Navis.
3. **Listas web de Navis:** los paneles rellenos del acento de cada lista y la cabecera del mismo color son rasgos propios que deben sobrevivir al traslado móvil.

La investigación anterior también inspeccionó dos imágenes locales de TaskEase y Sayki; sirven como apoyo para separación de superficies y claridad de tarjetas. No establecen la identidad de Navis.

Antes de implementar, capturar pantallas reales de Navis en claro/oscuro, y un botón/FAB de Tomtask si se puede abrir la referencia. Si Refero pasa a estar disponible, buscar estilos primero y después pantallas de directorios, listas de personas y hojas de configuración. No sustituir esta feature por un gestor de tareas.

### Decisiones visuales fijadas

| Decisión                                        | Origen                         | Aplicación                                                                 |
| ----------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------- |
| Sombra corta del mismo color del botón          | Petición del usuario y Tomtask | Acciones primarias y variante destructiva rellena; intensidad contenida.   |
| Mayor profundidad en acción flotante, si existe | Tomtask + jerarquía de Navis   | Reservar énfasis máximo a la acción principal, sin llenar todo de sombras. |
| Superficies neutras con separación suave        | Componentes y reglas de Navis  | Tarjetas, formularios y hojas; evitar halos cromáticos en todas las filas. |
| Panel y cabecera con color propio de la lista   | `ListPanel`/`ListHeader` web   | Conservar el papel semántico de `accent`, con texto legible.               |
| Tipografía, azul y barco de Navis               | Tokens y regla de identidad    | Mantener identidad y temas; no copiar marca o fuente de Tomtask.           |
| Acciones secundarias en menú/hoja               | Ergonomía móvil y UI existente | Mantener todas las opciones sin comprimir botones de escritorio.           |

## 4. Fase 0 — inventario y contrato local

Antes de escribir producción:

- Revisar las reglas de `.claude/rules`, el plan de componentes y los planes móviles existentes. Consultar el grafo si sus herramientas están disponibles; no lo estaban al preparar este documento.
- Inventariar cada control de la web: portada, ficha, miembros, estadísticas, compartir, accesos y exportación. Registrar defaults, validación, permisos y efectos.
- Documentar el mapeo **entidad/columna web → SQLite local → modelo TypeScript**. No confundir campos calculados de respuesta con columnas físicas.
- Fijar aislamiento por iglesia activa, usuario y referencias, siguiendo los patrones actuales de iglesias móvil. Toda consulta y mutación debe validar contexto y pertenencia.
- Ejecutar una comprobación inicial de tipos/tests antes de editar y registrar los fallos preexistentes.

### Tablas y columnas de referencia

| Tabla             | Columnas de dominio observadas                                                                                                                                                                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lists`           | `church_id`, `name`, `slug`, `description`, `accent`, `position`, `is_active`, `visibility`, `share_token`, `shared_at`, `share_expires_at`, `public_fields`, `allow_download`, `cover_key`, `created_by`; además las columnas heredadas de `BaseEntity`. |
| `list_members`    | PK compuesta `list_id`/`believer_id`, `position`, `note`, `added_at`, `added_by`.                                                                                                                                                                         |
| `list_viewers`    | `church_id`, `believer_id`, `username`, `password_hash`, `label`, `is_active`, `expires_at`, `sessions_valid_from`, `last_seen_at`, `created_by`; además las columnas de `BaseEntity`.                                                                    |
| `list_grants`     | PK compuesta `viewer_id`/`list_id`, `granted_at`, `granted_by`.                                                                                                                                                                                           |
| `list_views`      | `id`, `list_id`, `viewer_id`, `viewed_at`, `visitor_hash`, `ip_prefix`, `device`, `platform`, `referrer_host`, `views`.                                                                                                                                   |
| `list_access_log` | `id`, `list_id`, `viewer_id`, `username`, `outcome`, `ip_prefix`, `at`.                                                                                                                                                                                   |

Verificar tipos, nulabilidad, defaults, índices, borrado lógico y columnas heredadas contra las entidades vigentes. UUID y fechas conservan significado; SQLite puede representar booleanos/fechas de forma distinta, con conversión explícita y comprobada.

`memberCount`, `initials`, `recentViews` y `hasCover` son datos derivados de respuesta, no columnas que haya que añadir por copiar un tipo. No almacenar contraseñas en claro.

Crear migración local transaccional y versionada; actualizar `test-support.js`/`ALL_TABLES` para que los tests limpien también las tablas nuevas. No cambiar las tablas web ni añadir sincronización por este trabajo.

## 5. Fase 1 — pulido visual primero

### Tokens y primitivos

- Definir elevación móvil por roles en `apps/mobile/src/lib/ui/`, derivada de `themeColorsHex` y del color efectivo del control. No modificar globalmente tokens compartidos si eso altera la web fuera del alcance.
- Separar botón, acción flotante, tarjeta, selección y hoja. Punto inicial a validar: sombra de botón con desplazamiento 4–6, desenfoque 12–18 y opacidad 0,15–0,24; el oscuro se ajusta según contraste de superficies. Son propuestas, no valores aprobados por una captura.
- Ampliar `Button` e `IconButton` conservando variantes y tamaños actuales. Respetar `PressableProps`, estilos del consumidor, carga, estado deshabilitado y callbacks existentes.
- Comprobar soporte de `boxShadow` en RN 0.86 y Android objetivo; usar una alternativa centralizada si es necesaria. El ripple/recorte interno no debe cortar la sombra exterior.
- Refinar selección en chips/segmentos, foco y errores de campos, profundidad de tarjetas y separación de hojas inferiores. Mantener coherencia del color sin aplicar brillo indiscriminado.
- Respuesta de pulsación breve; respetar movimiento reducido y usar patrones existentes de animación/haptics. No añadir dependencias decorativas.

### Propagación

Revisar pantallas de Navis que consumen estos primitivos: altas y edición, creyentes, calendario, enseñanzas, ajustes y autenticación. Sustituir acabados duplicados cuando corresponda, sin rediseñar cada pantalla. Capturar antes/después y verificar claro/oscuro.

Salida de fase: pequeños detalles consistentes y probados en la app de Navis; no basta un cambio de constantes.

## 6. Fase 2 — tablón y ficha de Listas

### Paridad funcional

| Área de la web              | Implementación móvil prevista                                                                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tablón de listas activas    | Paneles del color propio, nombre, descripción, recuento, iniciales, visibilidad y actividad disponible; vacío, carga/error y crear según permisos.                                                       |
| Alta y edición              | Nombre, descripción y color con mismos límites/defaults. Slug estable al renombrar.                                                                                                                      |
| Cabecera y gestión          | Color de lista, información y acciones de editar/eliminar; conservar estado/posición del modelo aunque ciertos controles no estén expuestos en portada.                                                  |
| Personas                    | Añadir creyentes existentes, excluir duplicados, mostrar información de filas, subir/bajar o reordenar, editar nota y quitar miembro. Quitar no borra el creyente.                                       |
| Estadísticas de composición | Congregaciones, ministerios, dones y solapamiento entre listas; mismo significado y cálculos sobre SQLite local.                                                                                         |
| Estadísticas de audiencia   | Visitas, visitantes, procedencias, actividad por acceso e historial: mostrar únicamente datos reales; ver límite de independencia en la fase 3.                                                          |
| Exportación                 | Auditar los cinco formatos de la web, sus columnas y opciones; generar localmente y usar descarga/compartir nativo. Reutilizar utilidades puras y patrones móviles existentes cuando sirvan.             |
| Compartir y configuración   | Privada/enlace/restringida, campos públicos, estilo de nombre, foto, notas, caducidad, permitir descarga, portada y dejar de compartir; conservar el modelo, con implementación condicionada por fase 3. |
| Accesos                     | Crear de creyente o grupo, usuario/contraseña, conceder/revocar listas, alta en lote, directorio, caducidad y regeneración; misma distinción entre miembro y permiso de lectura.                         |

### Composición móvil

`app/lists.tsx` será una ruta fina hacia una pantalla real. Añadir ficha con ruta dinámica según las convenciones vigentes de Expo Router. Mantener Personas/Estadísticas/Compartir como secciones reconocibles, con acciones principales al alcance del pulgar y secundarias en hojas.

Componentes nuevos bajo `apps/mobile/src/components/lists/`; lógica bajo `src/lib/lists/` o hooks del patrón existente; persistencia bajo `src/data/repos/`. Consultas locales de TanStack Query con clave de iglesia/lista; invalidación acotada después de cada mutación. No usar hooks HTTP de la web para sustituir repositorios SQLite.

El orden de miembros es dato, no decoración. Reordenar de forma transaccional, conservar personas filtradas y validar que las referencias pertenecen a la misma iglesia. Aplicar permisos equivalentes `lists.view`, `lists.manage`, `lists.share` con el patrón móvil actual.

## 7. Fase 3 — compartir sin contradecir la independencia

**Punto técnico pendiente, explícito:** la web publica enlaces y mide visitas mediante su servidor. Una lista guardada solo en el teléfono no se vuelve accesible desde Internet por tener `share_token` o por pulsar «Publicar».

Dentro del alcance independiente se puede implementar exportación local, compartir archivos/carteles mediante el sistema, configurar campos incluidos y conservar el modelo de datos. Eso no equivale a un enlace público con credenciales, revocación o estadísticas de audiencia.

Antes de implementar publicación remota, resolver con el usuario qué mecanismo independiente la servirá. No conectar la app a la API/web de Navis por inferencia, no crear un backend nuevo sin acordarlo y no generar enlaces ficticios. La paridad completa de publicación/accesos queda pendiente de esa decisión; no marcarla completa mediante controles decorativos o permanentemente deshabilitados.

Mientras tanto, avanzar en pulido, almacenamiento, tablón, miembros, estadísticas locales y exportación. Registrar el alcance real de compartir en la interfaz con textos útiles al usuario, sin detalles internos innecesarios.

## 8. Verificación y criterios de aceptación

- [ ] Cambios exclusivamente orientados a `apps/mobile` de Navis; Taskia limpio y usado como referencia de lectura.
- [ ] Mismas columnas/modelos de Listas, con prueba de migración sobre una base anterior y preservación de datos.
- [ ] Aislamiento entre dos iglesias, validación de referencias y permisos de lectura/gestión/compartir.
- [ ] Crear, editar, añadir, ordenar, anotar y quitar personas funciona localmente, sin exigir que la web esté abierta ni llamar a su API.
- [ ] Renombrar conserva slug; eliminar lista explica efectos y no borra personas.
- [ ] Estadísticas locales y exportaciones contienen los datos reales y el orden correcto.
- [ ] Configuraciones y controles inventariados de la web implementados o pendientes identificados con causa concreta; publicación remota no se declara resuelta sin mecanismo acordado.
- [ ] Sombras siguen color y tema; estados pulsado/carga/deshabilitado, contraste, safe areas y teclado probados.
- [ ] Textos en seis idiomas, etiquetas accesibles, targets ≥44 y texto aumentado; revisar español y alemán/francés.
- [ ] Vacío, error, doble toque, muchas personas, notas/nombres largos y reinicio de la app.
- [ ] Tests de repositorios y comportamiento de pantalla conforme a `.claude/rules/04-probar-lo-que-se-hace.md`.
- [ ] Tipos/lint/tests/formato pertinentes; cerrar con `rtk pnpm check`, e2e relevantes y `rtk pnpm --filter @navis/mobile exec expo-doctor` según reglas del repo.
- [ ] Verificación nativa en emulador/dispositivo, claro/oscuro y teléfono/tablet. El repo advierte que el preview web móvil falla por `expo-sqlite`; no usarlo como sustituto de QA nativa.

## 9. Próxima sesión: orden de trabajo

1. Leer este plan y revisar el estado actual de Navis. El progreso de Taskia **no** cuenta como implementación aquí.
2. Confirmar baseline y capturas de Navis; completar inventario web de Listas y mapeo de esquema.
3. Implementar y verificar los detalles visuales compartidos (fase 1).
4. Implementar migración/repositories locales y pruebas de aislamiento/compatibilidad.
5. Sustituir placeholder por tablón, formularios, ficha y miembros.
6. Completar estadísticas locales y exportación.
7. Resolver mecanismo de publicación independiente antes de programar enlaces, accesos remotos e historial de audiencia.
8. Completar QA funcional/visual y actualizar cada fase con evidencia, fallos conocidos y pendientes.

### Registro de progreso

Actualizado tras implementar: las descripciones de estado inicial anteriores son el inventario histórico. El resultado y la verificación actuales se detallan en [el informe de implementación](../implementados/listas-y-pulido-visual-movil-implementacion.md).

| Fase                                          | Estado al 2026-10-02                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------------- |
| Corrección de ubicación y reversión en Taskia | Hecha; árbol de Taskia comprobado limpio.                                    |
| Plan Navis y revisión inicial                 | Hechos; documento en `docs/planes/pendientes/`.                              |
| Inventario exhaustivo y contrato SQLite       | Hechos; seis tablas, migración 12 y paridad de columnas probada.             |
| Pulido visual en Navis                        | Implementado en los primitivos existentes; QA Android claro/oscuro.          |
| Listas locales de Navis                       | Implementadas: tablón, gestión, miembros, composición y cinco exportaciones. |
| Publicación/accesos/audiencia remotos         | Pendiente de definir mecanismo compatible con independencia.                 |
| Tests y QA de implementación                  | Ejecutados; evidencia y límites en el informe de implementación.             |
