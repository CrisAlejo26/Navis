# Regla 6 — Archivos cortos (objetivo: ≤ 100 líneas)

Ningún archivo de código **debería superar las ~100 líneas**. El límite es una guía, no un
número rígido: puede pasarse **unas pocas** líneas cuando partir el archivo lo empeoraría,
pero **no por mucho**. Un archivo que crece bastante más allá de 100 líneas es señal de que
hace demasiado y hay que dividirlo.

- **Una responsabilidad por archivo.** Si un archivo acumula varias responsabilidades,
  sepáralas (componentes, hooks, utilidades, tipos) en archivos propios.
- **Extraer en lugar de inflar.** Antes de añadir más líneas, mueve lógica común a `src/lib/`,
  componentes a `src/components/`, estado a `src/stores/` o a un hook compartido. Esto refuerza
  la Regla 1 (DRY y patrones de diseño).
- **Componentes:** divide UI grande en subcomponentes; extrae la lógica a custom hooks.
- **Excepciones razonables:** archivos generados (`src/generated/prisma/`), de configuración o
  de datos (p. ej. `messages/*.json`) no cuentan para este límite.
- **Verificación:** al terminar un cambio, revisa que los archivos tocados sigan dentro del
  objetivo; si uno se disparó, refactorízalo antes de darlo por terminado.

> Si un archivo necesita muchas más de 100 líneas para funcionar, probablemente deberían ser
> varios archivos.
