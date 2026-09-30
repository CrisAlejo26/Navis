import { updateProfileSchema } from '@navis/shared';
import { z } from 'zod';

import { findUser, type LocalUser } from './account-repo';
import { getDb, nowIso } from '../db';

/**
 * Lo editable del perfil local: los campos de contacto del esquema de la web
 * (`updateProfileSchema`) más el nombre, que en la API vive en Better Auth.
 * Una cadena vacía en teléfono, ciudad o bio los deja en blanco.
 */
const profileInputSchema = updateProfileSchema
    .pick({ phone: true, city: true, bio: true, timezone: true })
    .extend({ name: z.string().trim().min(2).max(120).optional() });

const FIELDS = ['name', 'phone', 'city', 'bio', 'timezone'] as const;

export async function updateProfile(userId: string, input: unknown): Promise<LocalUser | null> {
    const data = profileInputSchema.parse(input);
    const fields = FIELDS.filter((key) => data[key] !== undefined);

    if (fields.length > 0) {
        const db = await getDb();
        await db.runAsync(
            `UPDATE local_user SET ${fields.map((key) => `${key} = ?`).join(', ')}, updated_at = ? WHERE id = ?`,
            ...fields.map((key) => {
                const value = data[key] ?? null;
                const blankable = key === 'phone' || key === 'city' || key === 'bio';
                return blankable && value === '' ? null : value;
            }),
            nowIso(),
            userId,
        );
    }

    return findUser(userId);
}
