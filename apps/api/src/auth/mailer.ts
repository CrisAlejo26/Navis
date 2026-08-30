import type { ApiEnv } from '@navis/shared';
import { createTransport, type Transporter } from 'nodemailer';

/**
 * Envío de correo para el flujo de «recuperar contraseña» (RFC 0023).
 *
 * Fábrica con opciones (Regla 1 §3), como `createAuthDatabase` de
 * `auth.ts`: vive fuera del grafo de Nest porque `auth.ts` también vive
 * fuera de él —`betterAuth()` se crea al cargar el módulo, antes de que
 * exista el contexto de la aplicación—, así que el correo sigue el mismo
 * patrón en vez de montar un módulo de Nest para un único consumidor.
 */
export interface Mailer {
  sendPasswordReset: (to: string, url: string) => Promise<void>;
}

function createTransporter(env: ApiEnv): Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) return null;

  return createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });
}

export function createMailer(env: ApiEnv): Mailer {
  const transporter = createTransporter(env);
  const from = env.SMTP_FROM ?? env.SMTP_USER ?? 'Navis <no-reply@navis>';

  return {
    async sendPasswordReset(to, url) {
      if (!transporter) {
        // Instalación sin SMTP configurado (desarrollo local, sqlite): el
        // registro y el login siguen funcionando, solo no sale el correo.
        console.warn(`[mailer] SMTP no configurado; enlace de recuperación para ${to}: ${url}`);
        return;
      }

      await transporter.sendMail({
        from,
        to,
        subject: 'Recupera tu contraseña de Navis',
        text: passwordResetText(url),
        html: passwordResetHtml(url),
      });
    },
  };
}

function passwordResetText(url: string): string {
  return [
    'Alguien pidió recuperar la contraseña de tu cuenta de Navis.',
    '',
    `Para fijar una nueva, abre este enlace (caduca en una hora): ${url}`,
    '',
    'Si no has sido tú, puedes ignorar este correo: tu contraseña sigue igual.',
  ].join('\n');
}

// El correo es un texto plano con un único botón — sin plantilla ni
// dependencias nuevas, y a propósito de marca sobria (Regla 7 §5: el azul
// de la interfaz, no un diseño con logo que haya que mantener aparte).
function passwordResetHtml(url: string): string {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:32px 16px;background:#f5f6fa;font-family:sans-serif;color:#1a1a2e;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;">
      <tr>
        <td style="font-size:20px;font-weight:600;padding-bottom:16px;">Navis</td>
      </tr>
      <tr>
        <td style="background:#ffffff;border-radius:12px;padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
            Alguien pidió recuperar la contraseña de tu cuenta.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${url}" style="display:inline-block;background:#2140cf;color:#ffffff;
              text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">
              Fijar contraseña nueva
            </a>
          </p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">
            El enlace caduca en una hora. Si no has sido tú, puedes ignorar este
            correo: tu contraseña sigue igual.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
