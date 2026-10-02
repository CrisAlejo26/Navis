# Listas y pulido visual móvil — implementación

Fecha: 2026-10-02. Referencia: [plan autorizado](../pendientes/listas-y-pulido-visual-movil-plan.md).

## Resultado y alcance

Listas funciona con SQLite en Navis móvil. No se conecta a la API ni sincroniza con la web. Taskia no se ha modificado. La dirección sigue los paneles y pestañas de Listas web, Roboto y los tokens de Navis; Tomtask solo informa la profundidad cromática. Refero se ha aplicado con las referencias del plan y el código de Navis, sin atribuir investigación a un MCP no disponible.

Se ha reutilizado el escritor ZIP puro para XLSX: vive en `packages/shared`, mientras la web conserva su envoltorio Blob. También se comparten las declaraciones de las seis tablas para comprobar sus columnas frente a las entidades de la API y para incluirlas en las copias móviles. El ajuste de radios se limita a los tokens nativos; no cambia los tokens CSS web.

## Inventario de controles y contrato

| Control web                                                  | Resultado móvil                                                    | Defaults y efectos                                                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Tablón                                                       | Paneles coloreados, iniciales, recuento, vacío, carga/error y alta | Activas por defecto; interruptor para incluir desactivadas                                                   |
| Alta/edición                                                 | Hoja con nombre, descripción y acento                              | Validadores compartidos: nombre 2–60, descripción hasta 280; acento primary; renombrar conserva slug         |
| Gestión                                                      | Editar, desactivar/reactivar y eliminar con explicación            | Borrado lógico de lista; limpia miembros/concesiones; no borra creyentes                                     |
| Personas                                                     | Buscar, selección múltiple, añadir, subir/bajar, nota y quitar     | Sin duplicados; nota hasta 120; orden completo transaccional, incluidas personas ocultas por filtro          |
| Composición                                                  | Congregaciones, labores, dones y solapamiento                      | Calculado sobre personas locales vigentes de la misma iglesia                                                |
| Exportación                                                  | XLSX, PDF, PNG, Markdown y CSV, menú nativo                        | Orden y nombre siempre; nombre completo/inicial y campos opcionales persistidos; PNG limitado a 100 personas |
| Portada/fotos                                                | Selector y portada local, fotos opcionales en PDF/PNG              | Portadas incluidas en backup y rutas localizadas al restaurar; no se incrustan fotos en CSV/Markdown/XLSX    |
| Publicación                                                  | Pendiente del mecanismo independiente                              | No se generan tokens ni enlaces ficticios                                                                    |
| Visibilidad/caducidad/descargas remotas                      | Columnas conservadas; controles remotos pendientes                 | No existe servidor público móvil acordado                                                                    |
| Accesos individuales/grupales, lotes, contraseña, revocación | Pendientes junto con la publicación                                | Sin usuarios o contraseñas decorativos ni almacenamiento en claro                                            |
| Audiencia e historial                                        | Pendientes junto con la publicación                                | No se inventan visitas ni actividad                                                                          |

El móvil no dispone de roles granulares equivalentes a `lists.view/manage/share`. Se aplica su membresía local para lectura y propiedad de iglesia para gestión/exportación, validado también en repositorios. Un miembro lector no puede exportar ni modificar. La extensión a roles granulares exige ampliar el modelo de permisos local.

Las consultas y mutaciones validan iglesia, usuario y pertenencia de referencias. Las claves Query incluyen iglesia y usuario; los cambios de personas invalidan sus listas. `memberCount`, iniciales, fotos y composición se calculan, no añaden columnas de respuesta al esquema.

`packages/shared/src/local-list-schema.ts` declara tipos, nulabilidad y defaults de `lists`, `list_members`, `list_viewers`, `list_grants`, `list_views` y `list_access_log`; `local-schema.parity.test.ts` compara sus columnas físicas con las seis entidades API. SQLite representa booleanos como enteros y fechas/JSON como texto. La migración transaccional 11→12 crea índices de identidad, unicidad y consulta; la prueba comprueba preservación de iglesias/personas e idempotencia. Las referencias se validan en repositorios conforme al patrón SQLite existente.

## Pulido y decisiones nativas

Elevación central por rol: botón, flotante, tarjeta, selección y hoja. Primarias/destructivas siguen su color efectivo; pulsación y deshabilitado eliminan sombra. Se conservan estilos y callbacks del consumidor. La revisión Android detectó que combinar NativeWind con `style` como función perdía el tamaño y elevación: se resuelve la pulsación a un estilo concreto, manteniendo el contrato público.

Campos añaden anillo de foco/error, chips un mínimo táctil de 44 y segmentos 48. Los radios calculados se sustituyen por longitudes concretas en tokens nativos porque las tarjetas observadas se dibujaban cuadradas. FlatList/ScrollView nuevos usan padding/gap explícitos; el selector de personas evita anidar una lista virtualizada dentro de ScrollView. El contraste de cada panel se calcula con luminancia.

## Verificación

- `rtk pnpm check`: pasó formato, lint, tipos, tests y pruebas de scripts del monorepo. Móvil: 107 suites y 410 pruebas; scripts: 29 pruebas. Persisten 10 advertencias de lint previas y el aviso de cierre de workers de Jest, sin fallos.
- `rtk pnpm build`: compilación del monorepo.
- E2E web relevantes: 42 pruebas de exportación, listas públicas y manifiesto pasaron tras extraer ZIP.
- Paridad de esquema API: 71 comprobaciones pasaron, incluidas las seis tablas nuevas.
- Repositorios: aislamiento entre iglesias, referencias ajenas, lote revertido, duplicados, slug estable, orden, notas, borrado sin perder personas, composición, permisos y migración/reinicio.
- Backup: conserva listas/portadas y localiza el fichero en el teléfono de destino.
- UI/export: validación de formulario, lector sin gestión, límites de orden, callbacks de pulsación; escape HTML/Markdown, CSV protegido contra fórmulas y XLSX con cadenas inline.
- Android: compilación Gradle e instalación, alta, miembros, reordenación, nota, portada seleccionada/recortada y guardada desde galería, persistencia tras reinicio, pestañas y menú nativo PDF/PNG. PNG generado inspeccionado con orden correcto. Revisión visual en claro/oscuro, texto al 130 % y pantalla tablet simulada mediante resolución/densidad del emulador.

Capturas y archivos de QA locales en `apps/mobile/.expo/`: `lists-font130.png`, `lists-phone-dark.png`, `lists-tablet-dark.png`, `navis-export.png`. No existe una captura fiable de Navis anterior a los cambios; no se presenta una comparación antes/después como verificada. No se ha ejecutado QA iOS, ni recorrido visual completo de las seis traducciones o de todas las pantallas consumidoras; las pruebas globales cubren los primitivos compartidos. El catálogo de traducciones contiene las nuevas claves en los seis idiomas.

Expo Doctor pasa 19/20: queda la advertencia previa de versiones patch de Expo, constants y router. No se ha actualizado el SDK como parte de este trabajo. La publicación remota continúa en el plan pendiente hasta acordar cómo servir enlaces y credenciales de forma independiente.
