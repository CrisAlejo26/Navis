# Iglesias móvil — Fase 2

Implementada el 2026-10-01. Fases 3–6 pendientes de autorización.

- Esquema 11: `church_members` espeja las columnas reales de `ChurchMember`
  (incluye `BaseEntity`; no existe `joined_at` en la API). Paridad comprobada.
- `local_user.active_church_id` guarda la selección. Crear iglesia añade la
  membresía del dueño y la activa en la misma transacción; acepta país.
- Acceso por membresía explícita: listados excluyen iglesias y membresías
  borradas. Resolución conserva la guardada accesible, o elige la primera por
  fecha e id; sin acceso guarda nulo. Login y demo usan esta resolución.
- Migración idempotente, arranque y restauración reparan membresías ausentes
  del dueño. Una membresía dada de baja no se reactiva. La reparación invalida
  la activa inaccesible; la resolución posterior elige la alternativa.
- Las pestañas esperan la validación de SQLite y reconcilian AsyncStorage;
  sin iglesia accesible redirigen al alta. La caché se revalida al restaurar.
- El auditor SQL documenta la excepción del listado de acceso: se acota por
  usuario y membresía porque todavía no se ha elegido una iglesia.

## Verificación

- `pnpm check`: verde; 86 suites y 362 pruebas móviles, incluida migración
  desde un esquema sin tabla ni columna, repetición idempotente, selección,
  acceso revocado, iglesia borrada, ausencia de acceso, copia del esquema 10
  sin membresías y bloqueo de pestañas hasta reconciliar la sesión.
- Arranque en Android con la base existente: migración y pantalla Inicio
  correctas, con los mismos contadores. Se reinició Expo Go tras cambiar el
  módulo de apertura: Fast Refresh había dejado una transacción antigua.
- Expo Doctor: 19/20; siguen los desfases de parches de Expo, Constants y Router
  ya documentados en Fase 1. No se modificaron dependencias.
- La restauración antigua se probó en SQLite real con Jest. No se sustituyó la
  base existente del emulador para probar restauración ni la matriz completa
  de tres iglesias: el selector corresponde a Fase 4 y el recorrido a Fase 6.
