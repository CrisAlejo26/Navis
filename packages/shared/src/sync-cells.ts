import { z } from 'zod';

/**
 * La celda de contraseña tal y como la guarda el teléfono: cifrada con una clave
 * del aparato (`expo-crypto`, en SecureStore). Solo ese teléfono puede abrirla.
 */
export const deviceCellEnvelopeSchema = z.object({
    navisCipher: z.literal(1),
    keyId: z.string(),
    sealed: z.string(),
});

export type DeviceCellEnvelope = z.infer<typeof deviceCellEnvelopeSchema>;

export type CellData = Record<string, unknown>;

/** Si algún valor sigue siendo un sobre del aparato. */
export function containsDeviceEnvelope(data: CellData): boolean {
    return Object.values(data).some((value) => deviceCellEnvelopeSchema.safeParse(value).success);
}

/**
 * Teléfono → protocolo. Los sobres se abren con las claves del aparato y viajan
 * en claro por el canal autorizado: el servidor los vuelve a cifrar con la suya
 * (RFC 0021 D21). Subir el sobre sería declarar que la web puede leer algo que
 * solo entiende este móvil.
 */
export async function cellsToWire(
    data: CellData,
    open: (envelope: DeviceCellEnvelope) => Promise<string>,
): Promise<CellData> {
    const wire: CellData = {};
    for (const [key, value] of Object.entries(data)) {
        const envelope = deviceCellEnvelopeSchema.safeParse(value);
        wire[key] = envelope.success ? await open(envelope.data) : value;
    }
    if (containsDeviceEnvelope(wire)) throw new Error('Quedó un sobre del aparato sin abrir');
    return wire;
}

/**
 * Protocolo → teléfono. Las columnas de contraseña llegan en claro y se cifran
 * con la clave de este aparato antes de guardarse; el resto no se toca. Un valor
 * vacío se queda vacío (no hay nada que cifrar).
 */
export async function cellsFromWire(
    data: CellData,
    passwordKeys: readonly string[],
    seal: (plain: string) => Promise<DeviceCellEnvelope>,
): Promise<CellData> {
    const local: CellData = { ...data };
    for (const key of passwordKeys) {
        const value = local[key];
        if (typeof value === 'string' && value !== '') local[key] = await seal(value);
    }
    return local;
}
