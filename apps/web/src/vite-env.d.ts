/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  /** URL base de la API de dominio, p. ej. http://localhost:3000/api/v1 */
  readonly VITE_API_URL: string;
  /** URL base de la API de autenticación (Better Auth), p. ej. http://localhost:3000 */
  readonly VITE_AUTH_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
