# Regla 4 — Probar siempre lo que se implementa

Ninguna implementación se considera terminada hasta que se ha **probado** y se ha
comprobado que funciona. La IA no debe afirmar que algo "está listo" sin evidencia.

- **Ejecutar las comprobaciones del proyecto** tras cada cambio:
  - Tipos: `rtk tsc`
  - Lint: `rtk lint`
  - Tests unitarios: `rtk vitest run`
  - Tests E2E (si aplica): `rtk playwright test`
  - Build (si el cambio lo amerita): `rtk next build`
- **Añadir o actualizar tests** cuando se crea o modifica lógica: cubrir el caso feliz y
  los casos límite relevantes.
- **Verificación funcional:** cuando el cambio es visible, comprobar el comportamiento real
  en la app (no solo que compile), incluyendo los distintos idiomas y temas cuando aplique.
- **Reportar con honestidad:** si un test falla o un paso se omitió, decirlo con la salida
  real; no afirmar que funciona sin haberlo verificado.

> "Funciona" significa probado, no asumido.
