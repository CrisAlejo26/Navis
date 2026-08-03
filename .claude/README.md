# Configuración de Claude Code para Navis

Lo que hay aquí se carga solo al trabajar en este repositorio. Va versionado
para que valga igual en cualquier equipo.

| Carpeta                   | Qué es                                                                |
| ------------------------- | --------------------------------------------------------------------- |
| [`rules/`](./rules)       | Las reglas del proyecto. Se aplican a **todo** lo que se escriba aquí |
| [`skills/`](./skills)     | Procedimientos que Claude sigue solo cuando la tarea encaja           |
| [`commands/`](./commands) | Órdenes que invocas tú con `/nombre`                                  |
| `settings.json`           | Permisos del proyecto. Versionado                                     |
| `settings.local.json`     | Tus permisos personales. **No** se sube (está en .gitignore)          |

## Las reglas

Ocho, y ninguna es decorativa:

1. **Reutilizar antes de escribir** — dónde vive cada cosa, dónde va lo nuevo y
   con qué patrones se resuelve
2. **Los seis idiomas, siempre** — es, en, fr, pt, de, it: dónde viven, cómo se
   nombran las claves y qué no se traduce
3. **Claro y oscuro** — tokens semánticos, cómo lo activa cada plataforma y
   dónde hay hexadecimales que sincronizar
4. **Probar lo que se hace** — qué comando pasar según lo que hayas tocado,
   dónde vive cada test y cómo se escriben aquí
5. **Responsive** — móvil, tablet y escritorio, con los patrones de navegación
   que ya están montados
6. **Ficheros cortos** — objetivo de 100 líneas, cómo partir cada cosa y las
   excepciones
7. **Identidad visual** — nada de cruces; el logo sale de un solo sitio y se
   genera con un comando
8. **Explorar con el grafo** — codebase-memory antes que abrir ficheros, con
   las consultas que funcionan en este repositorio

Las reglas 2, 3, 6 y 7 no son solo buenas intenciones: hay tipado y tests que
las hacen cumplir. Una traducción que falte no compila.

## Las skills

Propias del proyecto:

- **`implementar-rfc`** — llevar una feature de `docs/rfcs` a código sin
  tropezar con las trampas de la base de datos ni dejarse idiomas.
- **`comprobar-produccion`** — mirar si el despliegue está bien, de fuera hacia
  dentro.
- **`feature-builder`** — el flujo completo de una funcionalidad o un rediseño:
  analizar con el grafo, investigar referencias, plan en `docs/`, diseñar con
  las dos de abajo, implementar y probar.

Traídas de fuera y adaptadas a Navis:

- **`ui-ux-pro-max`** — base de datos consultable de estilos, paletas,
  tipografías y guías de UX ([upstream](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill),
  v2.11.0, MIT). Trae un script de Python; el stack de este repo es `react` y
  `react-native`.
- **`frontend-design`** — criterio estético para que la interfaz no parezca una
  plantilla ([upstream](https://github.com/anthropics/skills), Apache-2.0).

Las dos llevan una sección de Navis añadida al final o al principio de su
`SKILL.md`: la paleta, el símbolo y los seis idiomas ya están decididos y mandan
sobre lo que sugiera la skill.

Se activan solas cuando la tarea encaja con su descripción; no hay que
invocarlas.

## El grafo de código

El repositorio está indexado en el MCP **codebase-memory** con el nombre
`D-Proyectos_personales-Navis`. La Regla 8 explica cuándo usarlo; el servidor
MCP se configura por perfil (no va versionado aquí porque la ruta del binario
es de cada máquina). Instalación: <https://github.com/DeusData/codebase-memory-mcp>.

## Los comandos

- **`/release`** — publica una versión: sube el número, etiqueta, y GitHub
  Actions compila el APK y los instaladores.

## Si vienes de otro proyecto

No copies aquí `settings.local.json` ni reglas de otro repositorio: las rutas y
los comandos no coinciden y acabas con permisos que no sirven y reglas que
mienten. Este `settings.json` ya trae lo que se usa a diario en Navis.
