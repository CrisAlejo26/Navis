# Iglesias móvil — Fase 5

Implementada el 2026-10-01. Fase 6 pendiente de autorización.

## Resultado

- `listPendingNoteReminders(userId)` recorre las membresías vigentes. Excluye
  iglesias y creyentes borrados, bajas, otras autorías y referencias cruzadas.
  Devuelve `churchId` y nombre de iglesia junto al recordatorio.
- Sincronización de todas las iglesias accesibles, con límite global de 50
  avisos ordenados por fecha. Con varias iglesias, el título y el cuerpo por
  defecto identifican la iglesia; con una conservan el texto anterior.
- `data` incluye `churchId`. La reconciliación compara también el destino y
  reprograma avisos antiguos sin iglesia, aunque fecha y texto sigan iguales.
  Los avisos ya entregados que no incluyen iglesia se ignoran por seguridad.
- Al tocar un aviso se validan sesión hidratada, acceso, nota, creyente y autor.
  Si corresponde a otra iglesia, usa `useSwitchChurch` y espera a las pestañas
  y a la reconciliación de acceso antes de abrir la lectura de la nota.
  Funciona mediante listener y respuesta guardada del arranque en frío.
  Avisos obsoletos o ajenos no cambian contexto ni abren una nota incorrecta.
- Prueba de copia con dos iglesias: exportar, vaciar y restaurar recupera
  membresías, activa válida, creyentes, notas, calendarios, dones y audios.
  La restauración conserva el aislamiento entre ambas iglesias.
- Trampas de contexto, caché, rutas y avisos actualizadas en `CLAUDE.md`.

## Verificación

- `pnpm check`: correcto; móvil 100 suites y 391 pruebas, web 337, API 401,
  scripts 29/29. Formato, lint, tipos y builds de los paquetes correctos.
- Pruebas enfocadas: 9 suites, 35 pruebas correctas. Incluyen SQLite real,
  sincronización con 60 recordatorios alternados y tope global de 50, cambio
  de activa sin cancelaciones, baja de membresía y desactivación de avisos.
- Apertura con el hook completo y cambio de contexto real, en primer plano y
  arranque en frío. La prueba retrasa el montaje de pestañas y verifica que
  `push` sucede después de `replace`, con transición terminada y SQLite actualizado.
- Adaptador Expo ejercitado con doble del módulo nativo: contenido, iglesia,
  fecha, canal, actualización de avisos antiguos, idempotencia y cancelación.
- Android API 36, Expo Go: arranque comprobado con la iglesia creada en Fase 4,
  alemán y tema claro, conservando su selección. Captura temporal
  `navis-phase5-startup.png`. No se cambiaron datos del emulador original.
- Expo Go desactiva las notificaciones en este proyecto. No se verificó entrega,
  sonido ni toque desde la bandeja del sistema en una compilación nativa, ni iOS.
  Para esa comprobación: programar notas en dos iglesias desde una compilación
  nativa, dejar activa la primera y tocar el aviso de la segunda; repetir con
  la app cerrada. Debe cambiar de iglesia y abrir la lectura de esa nota.
- El grafo codebase-memory no está disponible en esta sesión; se comprobó el
  impacto mediante búsquedas de llamadas, lectura y la auditoría SQL estática.
