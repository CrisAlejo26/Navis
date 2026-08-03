-- Se ejecuta UNA sola vez, cuando el volumen de Postgres está vacío.
-- Si cambias este fichero, hace falta `pnpm db:reset` para que surta efecto.

-- `gen_random_uuid()` para las claves primarias de las entidades de dominio.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Búsqueda por similitud: la usarán los buscadores de creyentes y de notas.
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- Sin acentos ni mayúsculas al buscar («Jesús» encuentra «jesus»).
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Base de datos aparte para los tests e2e, que se vacía sin tocar la de desarrollo.
SELECT 'CREATE DATABASE navis_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'navis_test') \gexec
