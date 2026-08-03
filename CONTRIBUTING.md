# Contribuir a PastorTools

Gracias por querer aportar. Este documento recoge lo que hay que saber antes de
abrir un pull request.

## Antes de escribir código

Cada funcionalidad tiene un documento en [`docs/rfcs`](./docs/rfcs) con el
modelo de datos, la API y la interfaz previstos. Si vas a implementar una:
léelo, y si no estás de acuerdo con algo, discútelo en un issue antes de
programar. Si propones algo que no está documentado, escribe primero su RFC
sobre la [plantilla](./docs/rfcs/0000-plantilla.md).

Las decisiones técnicas ya tomadas están en [`docs/adr`](./docs/adr), con el
porqué. Si crees que una está equivocada, se escribe un ADR nuevo que la
supersede; no se edita el anterior.

## Preparar el entorno

```bash
pnpm install
cp .env.example .env
pnpm build:packages
pnpm db:migrate && pnpm db:seed
pnpm dev
```

No hace falta Docker: por defecto el proyecto usa una base de datos local en un
fichero. Solo lo necesitas si quieres probar el modo Postgres.

**Usa siempre pnpm.** El monorepo depende del catálogo de versiones y del enlace
entre paquetes del workspace; `npm install` o `yarn` rompen ambas cosas.

## Reglas de la casa

1. **Nada de texto sin traducir.** Cualquier cadena visible se añade a los
   **seis** idiomas de `packages/i18n` (es, en, fr, pt, de, it), con su
   traducción real. El español es la referencia: si añades una clave allí y no
   en el resto, no compila.
2. **Claro y oscuro.** Usa los tokens semánticos (`bg-background`,
   `text-muted-foreground`, `border-border`…), nunca colores fijos. Revisa el
   cambio en los dos temas antes de darlo por hecho.
3. **Responsive.** Móvil primero. Comprueba el resultado en un ancho de móvil,
   uno de tablet y uno de escritorio.
4. **Prueba lo que implementas.** Añade o actualiza tests, y ejecuta
   `pnpm check` (formato, lint, tipos y tests). Si algo falla o te lo saltas,
   dilo en el PR con la salida real.
5. **Ficheros cortos.** Alrededor de 100 líneas por fichero. Si crece mucho más,
   probablemente hace demasiadas cosas: extrae a `src/lib`, a un componente o a
   un hook.
6. **No te repitas.** Antes de escribir una utilidad, mira si ya existe en
   `packages/shared`, `packages/theme` o `src/lib`.

## Base de datos

- El esquema **solo** cambia con migraciones. `synchronize` está desactivado en
  todos los entornos, a propósito.
- Las migraciones deben funcionar en **SQLite y en Postgres**: se escriben con
  la API `Table` de TypeORM, no con SQL literal. Pruébalas en los dos.
- Las entidades se declaran explícitamente en `src/database/data-source.ts`.
- Orden obligatorio: `auth:migrate` antes que `migration:run`. `pnpm db:migrate`
  ya lo encadena.
- Las migraciones deben ser **compatibles hacia atrás** con la versión anterior
  del código: el despliegue las aplica antes de arrancar la nueva versión, y una
  reversión no las deshace. Renombrar o borrar una columna se hace en dos
  entregas. Ver [`docs/DESPLIEGUE.md`](./docs/DESPLIEGUE.md).

## Commits y pull requests

- **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`,
  `chore:`), que valida commitlint en el hook de pre-commit.
- Un PR, un cambio. Si te encuentras arreglando algo por el camino, sepáralo.
- En la descripción: qué cambia, por qué, y cómo se ha comprobado.
- La CI corre lo mismo que `pnpm check`, más los e2e, `expo-doctor`,
  `cargo check` y la construcción de las imágenes Docker. Tiene que estar en
  verde.

## Seguridad

Si encuentras una vulnerabilidad, **no abras un issue público**: escribe en
privado a quien mantiene el proyecto. Los datos que guarda esta aplicación
(notas pastorales, profecías, sueños) son especialmente sensibles.
