# Navis — escritorio (Tauri 2)

Empaqueta la **misma PWA** de `apps/web` como aplicación nativa de Windows, macOS
y Linux. No hay una tercera interfaz que mantener: lo que se arregla en la web se
arregla aquí.

## Requisitos

- Rust estable (`rustup`) — probado con 1.95.
- Las dependencias del sistema de Tauri para tu plataforma:
  <https://tauri.app/start/prerequisites/>.

## Comandos

```bash
pnpm dev:desktop      # arranca Vite y abre la ventana nativa (hot reload)
pnpm build:desktop    # compila la web y genera los instaladores
```

El build queda fuera de `pnpm build`: compilar Rust en release tarda minutos y no
tiene sentido en cada cambio de la API o de la web.

## A qué servidor apunta

A ninguno propio: usa las mismas variables que la web (`VITE_API_URL`,
`VITE_AUTH_URL`) **en el momento de construir**. Para una instalación local basta
con dejar la API en `localhost` con `DB_DRIVER=sqlite`; para trabajo en equipo,
apuntar a un servidor con `DB_DRIVER=postgres`. Ver
[`docs/rfcs/0007-modo-local-y-servidor.md`](../../docs/rfcs/0007-modo-local-y-servidor.md).

## Estructura

| Ruta                                  | Qué es                                         |
| ------------------------------------- | ---------------------------------------------- |
| `src-tauri/src/lib.rs`                | Lógica nativa y comandos expuestos al frontend |
| `src-tauri/src/main.rs`               | Punto de entrada del binario de escritorio     |
| `src-tauri/tauri.conf.json`           | Ventana, CSP, empaquetado e iconos             |
| `src-tauri/capabilities/default.json` | Permisos concedidos a la ventana               |

Los iconos se regeneran desde el icono de la app móvil con `pnpm icons`.
