# Iglesias móvil — Fase 3

Implementada el 2026-10-01. Fases 4–6 pendientes de autorización.

- `useSwitchChurch` valida membresía antes de cancelar consultas. Guarda la
  activa en SQLite y después actualiza la sesión. La escritura vuelve a validar
  acceso dentro de su transacción.
- Reinicia calendario y ancla, elimina consultas acotadas, invalida la caché,
  cierra pantallas apiladas y vuelve a Inicio. Sincroniza avisos y muestra
  `church.switched`: toast nativo en Android y aviso nativo en iOS.
- El bloqueo transitorio compartido evita dos cambios simultáneos. Mientras
  cambia, la puerta desmonta las pestañas (reinicia filtros y hojas locales) y
  los hooks acotados devuelven contexto nulo con consultas deshabilitadas.
- `useActiveChurchId` centraliza ese contexto y redirige al alta/bienvenida
  cuando falta, después de hidratar. Lo usan creyentes, notas, calendario,
  catálogos, panel y datos de la iglesia. Lo personal sigue por usuario.
- La consulta inline del calendario reutiliza `useLocalChurch`. Los prefijos
  acotados incluyen también las consultas heredadas `church` y `demo-data`;
  la caché personal permanece disponible.
- El alta inicial usa el mismo cambio de contexto. Solo `useSwitchChurch`
  llama a `setChurch` en producción; login y reconciliación conservan la
  inicialización de sesión que ya existía.
- Si se cierra sesión mientras espera una operación, el cambio aborta antes
  de actualizar el espejo o navegar; el bloqueo se libera también ante error.

## Verificación

- `pnpm check`: verde, 90 suites y 368 pruebas móviles; scripts 29/29.
- Prueba con SQLite real, dos iglesias, observador de notas montado y consulta
  de la iglesia anterior en vuelo: selección persistente, contadores de la nueva,
  calendario reiniciado y respuesta tardía descartada. Conserva caché personal.
- Pruebas de orden de pasos, acceso denegado antes de cancelar, fallo de escritura
  sin cambiar sesión/calendario, cambios simultáneos y cierre de sesión en vuelo.
- La puerta y el hook de contexto se prueban durante hidratación y transición;
  no abren pestañas ni redirigen al alta durante el cambio.
- Arranque comprobado en Android con la base existente: Inicio correcto y sin
  errores JavaScript. El recorrido visual entre dos/tres iglesias sigue pendiente
  del selector de Fase 4. No se probó iOS ni la reprogramación de avisos de varias
  iglesias: esa lógica corresponde a Fase 5.
- Expo Doctor sigue en 19/20 por los mismos tres parches pendientes de Expo,
  Constants y Router. No se modificaron dependencias.
