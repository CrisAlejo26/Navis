import { ApiError } from '@navis/api-client';
import {
  ownedChurchImpactSchema,
  type ChurchDecision,
  type OwnedChurchImpact,
} from '@navis/shared';
import { z } from 'zod';

/**
 * El estado del paso 2 de la baja de un dueño de iglesia (RFC 0015): qué se
 * ha elegido por cada una, todavía sin confirmar. Aparte de
 * `delete-user-dialog.tsx` porque es lógica de formulario, no presentación
 * (Regla 6).
 */
export type ChurchDecisions = Record<
  string,
  { action: ChurchDecision['action'] | ''; targetChurchId?: string }
>;

const ownedChurchesSchema = z.array(ownedChurchImpactSchema);

/** El 409 con el impacto de todas, validado en la frontera (Regla 10 §3). */
export function ownedChurchesFrom(cause: unknown): OwnedChurchImpact[] | null {
  if (!(cause instanceof ApiError) || cause.status !== 409) return null;

  const data = cause.body?.data as { ownedChurches?: unknown } | undefined;
  const parsed = ownedChurchesSchema.safeParse(data?.ownedChurches);
  return parsed.success ? parsed.data : null;
}

/** Con decisión de verdad para todas: elegida, y con destino si es traslado. */
export function decisionsComplete(
  decisions: ChurchDecisions,
  churches: OwnedChurchImpact[],
): boolean {
  return churches.every((church) => {
    const decision = decisions[church.id];
    if (!decision || decision.action === '') return false;
    return decision.action === 'delete' || Boolean(decision.targetChurchId);
  });
}

/** Los ids marcados para eliminar en este plan: no pueden ser destino de otra. */
export function churchesBeingDeleted(decisions: ChurchDecisions): string[] {
  return Object.entries(decisions)
    .filter(([, decision]) => decision.action === 'delete')
    .map(([churchId]) => churchId);
}

/** Lo que espera el servidor: una decisión resuelta por cada iglesia. */
export function toChurchDecisions(decisions: ChurchDecisions): ChurchDecision[] {
  return Object.entries(decisions)
    .filter(
      (entry): entry is [string, { action: ChurchDecision['action']; targetChurchId?: string }] => {
        const [, decision] = entry;
        return decision.action !== '';
      },
    )
    .map(([churchId, decision]) => ({
      churchId,
      action: decision.action,
      targetChurchId: decision.targetChurchId,
    }));
}
