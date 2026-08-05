/**
 * Los tres niveles de color de una tarjeta de métrica (RFC 0005 §7.1).
 *
 * Nacieron porque la portada de profecías se veía blanca: sus seis tarjetas
 * eran `bg-card` con degradados al 8 %, y un tinte por debajo del 12 % no se
 * ve. La regla que sale de ahí y que gobierna esto:
 *
 * - **`filled`** es el ancla, y va **una por rejilla**. Seis rectángulos azules
 *   con un número blanco son el cuadro de mandos de plantilla (Regla 9 §2).
 * - **`accent`** es lo demás que quiere color: pastilla del icono teñida,
 *   número en color y un filo arriba. Se ve, y no grita.
 * - **`plain`** es para lo que acompaña.
 *
 * Las clases van escritas enteras y no montadas con plantillas: Tailwind lee el
 * código fuente y una clase construida al vuelo no llega a existir.
 */
export const STAT_ACCENTS = ['primary', 'success', 'accent', 'warning'] as const;

export type StatAccent = (typeof STAT_ACCENTS)[number];

export interface StatToneClasses {
  /** El filo de color de arriba, que es lo que se ve de lejos. */
  edge: string;
  /** La pastilla del icono. Nunca por debajo del 12 % (§7.1.3). */
  chip: string;
  /** El número. Vacío cuando el color no da contraste como texto (ver abajo). */
  value: string;
}

/**
 * El color de cada familia, y **dónde se puede poner**.
 *
 * `primary` y `success` tienen luminosidad suficiente para leerse como texto en
 * los dos temas, así que tiñen también el número. El ámbar de `accent` y
 * `warning`, no: sobre blanco se queda en menos de 3:1 aunque sea un número
 * grande. En esos dos el color vive en la pastilla y en el filo —superficies
 * grandes y sólidas, donde el contraste lo pone el par de tokens— y el número
 * se queda en `foreground`.
 *
 * Y ojo con la tentación de usar `text-accent-foreground` ahí: ese token está
 * pensado para ir **encima** del ámbar, no sobre la tarjeta. En tema oscuro es
 * casi del color del fondo, y desaparece.
 */
export const ACCENT_TONE: Record<StatAccent, StatToneClasses> = {
  primary: {
    edge: 'border-t-[3px] border-t-primary',
    chip: 'bg-primary/12 text-primary',
    value: 'text-primary',
  },
  success: {
    edge: 'border-t-[3px] border-t-success',
    chip: 'bg-success/15 text-success',
    value: 'text-success',
  },
  accent: {
    edge: 'border-t-[3px] border-t-accent',
    chip: 'bg-accent text-accent-foreground',
    value: '',
  },
  warning: {
    edge: 'border-t-[3px] border-t-warning',
    chip: 'bg-warning text-warning-foreground',
    value: '',
  },
};

/**
 * La tarjeta rellena: fondo de marca y **su pareja `-foreground`**, siempre
 * juntas (Regla 3 §2). Poner el fondo sin el texto es la forma más rápida de
 * quedarse sin contraste en uno de los dos temas.
 */
export const FILLED_TONE = {
  card: 'border-primary bg-primary text-primary-foreground',
  chip: 'bg-primary-foreground/15 text-primary-foreground',
  label: 'text-primary-foreground/75',
  cta: 'text-primary-foreground',
} as const;
