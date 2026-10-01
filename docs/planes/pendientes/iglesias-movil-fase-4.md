# Iglesias móvil — Fase 4

Implementada el 2026-10-01. Fases 5 y 6 pendientes de autorización.

## Resultado

- Emblema determinista compartido con la web, conservando su hash y reparto.
  Adaptador Ionicons móvil y seis tintes con paridad claro/oscuro en JS y CSS.
- Placa accesible en Inicio, Calendario, Creyentes, Más y Ajustes. Selector con
  nombre, ciudad, activa marcada y Añadir iglesia siempre disponible.
- `settings/churches` y `church/new` fuera de `(auth)`. Alta inicial y adicional
  comparten formulario; edición comparte los campos. Crear activa la iglesia
  mediante el cambio de contexto centralizado, sin límite de iglesias.
- País inicial según región del dispositivo, fallback ES, editable por búsqueda.
  Claves nuevas traducidas en los seis idiomas.
- Nombres largos: una línea en placa, dos en filas y etiqueta accesible completa.
  Emblema y hoja respetan movimiento reducido. Contraste de los seis pares ≥4,5.
- Se corrigió SearchField: faltaba transmitir `value` y `onChangeText` al campo
  base, lo que impedía filtrar países y las otras búsquedas que lo reutilizan.
- El cambio solo llama `dismissAll` cuando `canDismiss` confirma una pila;
  desde pestañas evita el aviso POP_TO_TOP y sigue reemplazando por Inicio.

Referencias y decisiones previas en `iglesias-movil-fase-4-diseno.md`.
La placa usa el radio existente `rounded-2xl`, verificado en Android.

## Verificación

- `pnpm check`: correcto, 94 suites y 381 pruebas móviles; web 337 pruebas;
  scripts 29/29. Incluye regresión del hash web, contraste, región del país,
  selección/error, formulario con SQLite real, búsqueda controlada y país.
- Tras el ajuste de navegación: las cuatro suites afectadas pasan (6 pruebas),
  cubriendo tanto pila disponible como cambio desde la raíz.
- Android API 36, Expo Go, emulador independiente con datos demo a 375×812 dp.
  Alta de S-Gemeinde am Hafen von Hamburg und Umgebung, Hamburg, Alemania:
  país inicial US según dispositivo, búsqueda DE filtra y permite Alemania;
  creación activa la iglesia, Inicio muestra cero y Creyentes queda vacío.
- Calendario muestra la nueva placa y calendarios sembrados; al volver a la demo
  Inicio recupera 20 creyentes. Ajustes muestra dos iglesias; Mis iglesias permite
  cambiar y regresa a Inicio. Placa comprobada también en Más.
- Alemán en claro y oscuro: nombre largo en dos líneas, marca activa visible,
  Añadir accesible, tintes y truncado correctos. Capturas temporales
  `navis-phase4-de-dark-home.png`, `navis-phase4-de-dark-list.png`,
  `navis-phase4-de-dark-sheet.png` y `navis-phase4-de-light-sheet.png`.
- La sesión y los datos del emulador original se conservaron. No se probó iOS.
  El recorrido exhaustivo con dos y tres iglesias corresponde a Fase 6;
  los avisos de todas las iglesias y la copia multiiglesia, a Fase 5.
- Expo Doctor 19/20 por los mismos parches pendientes de Expo, Constants y Router.
  Sin cambios de dependencias. Jest conserva avisos conocidos de módulo nativo
  de notificaciones y cierre de un worker; todas las pruebas pasan.
