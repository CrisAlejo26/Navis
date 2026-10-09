const BASE_MS = 5_000;
const CAP_MS = 5 * 60_000;

/**
 * Cuánto esperar antes del reintento número `attempt` (empezando en 0): doble
 * cada vez hasta 5 minutos, con variación aleatoria de entre el 50 % y el 100 %
 * para que varios teléfonos que vuelven a tener red a la vez no golpeen al
 * servidor al mismo instante.
 */
export function retryDelayMs(attempt: number, random: () => number = Math.random): number {
    const ceiling = Math.min(CAP_MS, BASE_MS * 2 ** Math.max(0, attempt));
    return Math.round(ceiling * (0.5 + random() * 0.5));
}
