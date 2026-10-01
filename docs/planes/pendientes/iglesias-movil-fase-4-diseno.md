# Iglesias móvil — referencia y decisiones de Fase 4

## Objetivo y referencia fijada

Añadir selección de espacio pastoral en Android/iOS manteniendo la identidad
actual de Navis. Implementación directa sobre el sistema existente.
Refero MCP no está disponible; se consultaron las referencias de craft e iconos
incluidas en `.agents/skills/refero-design` y el producto existente.

Referencia dominante: `apps/web/src/components/church-switcher.tsx`,
`church-badge.tsx` y `church-menu.tsx`: emblema estable, nombre flexible,
chevron y marca de activa. Referencia secundaria: `BottomSheet`,
`SettingsRow` y `Select` del móvil; adaptan el menú al alcance del pulgar.
El hero actual del móvil conserva su escena náutica y su jerarquía.

## Decisiones antes de implementar

- Una placa por cabecera, bajo el saludo/título. Nombre en una línea con
  truncado y etiqueta accesible completa. Altura mínima 44 px.
- Seis tintes existentes en CSS web; extender su paridad a JS y NativeWind,
  claro y oscuro. Color en el emblema activo, apagado en otras iglesias.
- Un solo hash compartido, conservando exactamente el reparto de la web.
  Adaptador Ionicons del móvil; revisar visualmente que no haya cruces.
- Hoja con nombre y ciudad, activa marcada y acción Añadir al final. Nada de
  confirmación antes de cambiar. Error visible si falla.
- Mis iglesias usa las mismas filas; alta con nombre, ciudad y país. País
  inicial de la región válida del dispositivo, editable mediante búsqueda.
- Reutilizar campos entre alta inicial, alta adicional y edición. Mantener
  las rutas adicionales fuera de `(auth)`.
- Sin nuevos fondos decorativos, sombras ni imágenes. Movimiento con opacity
  en el emblema y entrada existente de BottomSheet, respetando reduced motion.

## Validación prevista

Jest para acceso, selección, país y alta; contraste de los tintes; compilación
completa. Android: crear iglesias, cambiar entre ellas, revisar cabeceras y
Mis iglesias en claro/oscuro y alemán a 375 dp. Guardar evidencias temporales.
