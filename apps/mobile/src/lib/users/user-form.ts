import {
    emailSchema,
    passwordSchema,
    roleSlugSchema,
    createManagedUserSchema,
    type CreateManagedUserInput,
    type ManagedUser,
    type UpdateManagedUserInput,
} from '@navis/shared';

export interface UserFormValues {
    name: string;
    email: string;
    password: string;
    role: string | null;
}

/** Claves de traducción de cada error, nunca el texto: el del esquema zod está en español (Regla 2 §6). */
export type UserFormErrorKey =
    'roles.fieldName' | 'roles.fieldEmail' | 'auth.passwordHint' | 'roles.fieldRole';

export type UserFormErrors = Partial<
    Record<'name' | 'email' | 'password' | 'role', UserFormErrorKey>
>;

export function emptyUserForm(): UserFormValues {
    return { name: '', email: '', password: '', role: null };
}

export function userFormOf(user: ManagedUser): UserFormValues {
    return { name: user.name, email: user.email, password: '', role: user.role };
}

function check(values: UserFormValues, needsPassword: boolean): UserFormErrors {
    const errors: UserFormErrors = {};
    if (!createManagedUserSchema.shape.name.safeParse(values.name).success)
        errors.name = 'roles.fieldName';
    if (!emailSchema.safeParse(values.email).success) errors.email = 'roles.fieldEmail';
    if (needsPassword && !passwordSchema.safeParse(values.password).success)
        errors.password = 'auth.passwordHint';
    if (!roleSlugSchema.safeParse(values.role).success) errors.role = 'roles.fieldRole';
    return errors;
}

export type CreateCheck =
    { ok: true; input: CreateManagedUserInput } | { ok: false; errors: UserFormErrors };

export function checkCreate(values: UserFormValues): CreateCheck {
    const errors = check(values, true);
    if (Object.keys(errors).length > 0) return { ok: false, errors };
    return { ok: true, input: createManagedUserSchema.parse(values) };
}

/** Qué hay que escribir: solo lo cambiado, y la contraseña nueva si el correo cambió. */
export type EditCheck =
    | { ok: true; unchanged: true }
    | { ok: true; unchanged: false; update: UpdateManagedUserInput; password: string | null }
    | { ok: false; errors: UserFormErrors };

/**
 * El correo es la sal del hash de la contraseña local: cambiarlo sin poner una
 * contraseña nueva dejaría la cuenta sin poder entrar. Por eso, con el correo
 * cambiado, la contraseña deja de ser opcional.
 */
export function emailChanged(original: ManagedUser, values: UserFormValues): boolean {
    return values.email.trim().toLowerCase() !== original.email;
}

export function checkEdit(original: ManagedUser, values: UserFormValues): EditCheck {
    const errors = check(values, emailChanged(original, values));
    if (Object.keys(errors).length > 0) return { ok: false, errors };
    const update: UpdateManagedUserInput = {};
    if (values.name.trim() !== original.name) update.name = values.name.trim();
    if (emailChanged(original, values)) update.email = values.email.trim().toLowerCase();
    // El rol solo viaja si cambia: reenviar el actual chocaría con el tope si es de nivel alto.
    if (values.role !== original.role) update.role = values.role ?? undefined;
    if (Object.keys(update).length === 0) return { ok: true, unchanged: true };
    return { ok: true, unchanged: false, update, password: update.email ? values.password : null };
}
