# Publicar una versión

Un solo comando deja en la página de releases de GitHub el APK de Android y los
instaladores de escritorio para que cualquiera pueda descargarlos y probarlos.

```bash
pnpm release patch      # 0.1.0 → 0.1.1
pnpm release minor      # 0.1.0 → 0.2.0
pnpm release major      # 0.1.0 → 1.0.0
pnpm release 1.4.2      # una versión concreta
```

Desde Claude Code también vale `/release patch`.

Antes de nada, para ver qué pasaría sin tocar nada:

```bash
pnpm release:dry minor
```

## Qué hace cada mitad

**En tu máquina** (`scripts/release.mjs`):

1. Comprueba que estás en `main`, con el árbol limpio y al día con el remoto.
2. Ejecuta `pnpm check` (formato, lint, tipos y tests). Con `--skip-checks` se
   salta, pero la CI los repite igualmente.
3. Sincroniza la versión **en todos los sitios a la vez**.
4. Commitea `chore(release): vX.Y.Z`, crea la etiqueta y la empuja.

**En GitHub** (`.github/workflows/release.yml`), al llegar la etiqueta:

1. Vuelve a pasar el CI completo. Si falla, no se compila nada.
2. Crea el release **en borrador**.
3. Compila en paralelo:
   - **Escritorio**: `.msi`/`.exe` (Windows), `.dmg` para Apple Silicon e Intel,
     `.AppImage`/`.deb` (Linux).
   - **Android**: un `.apk` instalable. **No se genera `.aab`**: ese formato
     solo sirve para subirlo a Play Store y aquí la distribución es directa.
   - **Web**: un `.zip` con el sitio ya construido, para autoalojarlo sin Docker.
4. Deja el release en borrador. Lo revisas y le das a **Publish release**.

Tarda unos 20 minutos, casi todo en compilar Rust para cuatro sistemas.

## Una sola versión para todo

Las cuatro apps comparten número de versión. «PastorTools 1.2.0» es una cosa
sola, no cuatro que hay que cruzar en una tabla. El script mantiene en sintonía:

| Dónde                                              | Qué                                     |
| -------------------------------------------------- | --------------------------------------- |
| `package.json` de la raíz y de cada app            | `version`                               |
| `apps/mobile/app.config.ts`                        | `version` y el `versionCode` de Android |
| `apps/desktop/src-tauri/tauri.conf.json`           | `version`                               |
| `apps/desktop/src-tauri/Cargo.toml` y `Cargo.lock` | `version` del paquete                   |

El `versionCode` de Android se calcula solo a partir de la versión
(1.4.2 → 10402). Android exige un entero que siempre crezca: si baja, el
teléfono rechaza la actualización.

Tú controlas **cuánto** sube (`patch`, `minor`, `major` o el número exacto); lo
que no se puede es que una app se quede atrás.

## Firmar el APK

Sin configurar nada, el APK sale firmado con la clave de depuración de Android:
se instala sin problema y sirve para probar, pero **no permite actualizar** una
instalación anterior firmada con otra clave. El propio release lo avisa.

Para firmarlo con una clave estable, hazlo una vez:

```bash
keytool -genkeypair -v \
  -keystore pastortools.keystore \
  -alias pastortools \
  -keyalg RSA -keysize 2048 -validity 10000
```

Guarda ese fichero **fuera del repositorio** y en sitio seguro: si lo pierdes,
nadie podrá actualizar la app y habrá que reinstalarla desde cero.

Después, en `Settings → Secrets and variables → Actions`:

| Secreto                     | Valor                             |
| --------------------------- | --------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | `base64 -w0 pastortools.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | La contraseña del almacén         |
| `ANDROID_KEY_ALIAS`         | `pastortools`                     |
| `ANDROID_KEY_PASSWORD`      | La contraseña de la clave         |

A partir del siguiente release, el APK se firma con esa clave y las
actualizaciones se instalan encima de la versión anterior.

## A qué servidor apuntan las descargas

Las apps que se compilan aquí llevan grabada la URL de la API: en escritorio y
web se incrusta al construir, y en móvil también. Salen de las variables del
repositorio (`Settings → Variables`):

| Variable                                       | Para qué         |
| ---------------------------------------------- | ---------------- |
| `VITE_API_URL` / `VITE_AUTH_URL`               | Escritorio y web |
| `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_AUTH_URL` | Android          |

Si no las defines, apuntan a `localhost:3000`, que es lo correcto para que
alguien pruebe la app contra su propia API local, pero **no** para publicar
binarios que la gente vaya a usar contra tu servidor. Ver
[RFC 0007](./rfcs/0007-modo-local-y-servidor.md).

## Firma de escritorio

Los instaladores tampoco llevan certificado comercial, así que Windows
SmartScreen y Gatekeeper avisan la primera vez. Firmarlos cuesta dinero (un
certificado EV en Windows, la cuenta de desarrollador en Apple) y es una
decisión de más adelante; las notas del release ya explican cómo abrirlos.

## Si algo sale mal

- **La etiqueta ya existe**: `git tag -d vX.Y.Z && git push origin :vX.Y.Z`, y
  borra también el release en borrador desde GitHub.
- **Falla un sistema y los demás no**: relanza solo ese job desde Actions. El
  release sigue en borrador y los artefactos ya subidos se conservan.
- **Te has equivocado de versión**: mientras esté en borrador, bórralo,
  elimina la etiqueta y vuelve a lanzar `pnpm release` con el número correcto.
