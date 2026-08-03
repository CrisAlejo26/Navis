import { parseEnv, webEnvSchema } from '@fidus/shared';

/**
 * Variables de entorno del cliente, validadas con zod al cargar la app.
 *
 * Vite solo expone al navegador las que empiezan por `VITE_`, así que aquí
 * nunca hay secretos: solo a qué servidor apunta esta instalación. Cambiando
 * estas dos variables en el `.env` la misma web pasa de una base de datos
 * local a un servidor compartido, sin tocar código.
 */
export const env = parseEnv(webEnvSchema, import.meta.env, 'apps/web — revisa tu .env');
