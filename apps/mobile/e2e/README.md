# Cuaderno: flujo Android sin dependencias nuevas

Requiere Python y adb en PATH, un emulador de QA con compilación nativa de
Navis conectada a Metro y una sesión de propietario de iglesia. Elegir español
o alemán y el tema en Ajustes antes de ejecutarlo. No usar datos reales.

Desde la raíz:

```powershell
python apps/mobile/e2e/journal_flow.py --locale de
python apps/mobile/e2e/journal_flow.py --locale es
```

El guion pulsa la interfaz: crea, añade recordatorio para mañana, edita,
atiende, abre el selector de imagen y borra con confirmación. Guarda capturas
en docs/qa/cuaderno-movil/flujo-{idioma}. No envía la imagen a nadie ni escribe
directamente SQLite. Si falla antes del borrado, retirar la entrada QA desde
la interfaz. La búsqueda verifica que el título borrado desapareció.

Maestro no se ha instalado: el plan exige autorización explícita para esa
herramienta. Este guion es la alternativa adb prevista en el plan.

En el emulador de QA se desactivó la escritura con lápiz de Gboard para evitar que su tutorial intercepte input text de adb. No afecta al cuaderno.

## Usuarios

```powershell
python apps/mobile/e2e/users_flow.py --locale es
python apps/mobile/e2e/users_flow.py --locale en
```

Mismos requisitos que el cuaderno, y la sesión tiene que ser de un pastor (o
superadmin): sin `users.manage` no hay botón de alta. Crea una cuenta de
prueba (`qa<marca de tiempo>@navis.app`), la abre, edita su nombre, cambia su
contraseña y la elimina, con capturas en docs/qa/usuarios-movil/flujo-{idioma}.
Si falla a mitad, retirar esa cuenta desde la ficha. El texto va por
`adb input text`: nombres sin acentos.

Sin compilación nativa conectada a Metro, el flujo de usuarios también corre en
Expo Go: `NAVIS_EXPO_GO=1 python apps/mobile/e2e/users_flow.py` (Metro normal, no
`--dev-client`). Avisos de Expo Go como el de Reanimated se cierran antes.
