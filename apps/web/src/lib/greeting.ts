/** Las tres claves del saludo, en el orden del día. */
export const GREETING_KEY = {
  morning: 'home.goodMorning',
  afternoon: 'home.goodAfternoon',
  evening: 'home.goodEvening',
} as const;

export type GreetingKey = (typeof GREETING_KEY)[keyof typeof GREETING_KEY];

/**
 * Con qué se saluda a esta hora.
 *
 * Los cortes son los del castellano hablado —de 6 a 12 por la mañana, hasta las
 * 20 por la tarde y el resto por la noche—, y valen para los seis idiomas
 * porque los tres saludos existen en todos. La madrugada cuenta como noche: a
 * las tres es lo que diría cualquiera.
 *
 * Recibe la fecha en vez de mirar el reloj por dentro para poder probarla.
 */
export function greetingKeyFor(date: Date): GreetingKey {
  const hour = date.getHours();

  if (hour >= 6 && hour < 12) return GREETING_KEY.morning;
  if (hour >= 12 && hour < 20) return GREETING_KEY.afternoon;
  return GREETING_KEY.evening;
}
