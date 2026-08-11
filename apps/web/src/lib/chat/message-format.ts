/**
 * Formato en el texto de un mensaje (RFC 0019 §1): negrita, cursiva, tachado
 * y monoespaciado con la misma sintaxis que ya usa WhatsApp — quien la
 * conoce la escribe sin pensar —, y color con una sintaxis propia de Navis
 * (WhatsApp no tiene color de texto), generada siempre desde la barra del
 * compositor, nunca a mano.
 *
 * Un tokenizador de una pasada, no una librería de Markdown completa: aquí
 * no hacen falta listas, enlaces ni encabezados (Regla 1 §4).
 */
export const COLOR_TOKENS = ['primary', 'success', 'warning', 'destructive', 'accent'] as const;

export type ColorToken = (typeof COLOR_TOKENS)[number];

export type MessageSegment =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; children: MessageSegment[] }
  | { kind: 'italic'; children: MessageSegment[] }
  | { kind: 'strike'; children: MessageSegment[] }
  | { kind: 'code'; text: string }
  | { kind: 'color'; token: ColorToken; children: MessageSegment[] };

const COLOR_RE = new RegExp(`\\{c:(${COLOR_TOKENS.join('|')})\\}([\\s\\S]+?)\\{/c\\}`);
const CODE_RE = /`([^`\n]+)`/;
const BOLD_RE = /\*([^\n*]+)\*/;
const ITALIC_RE = /_([^\n_]+)_/;
const STRIKE_RE = /~([^\n~]+)~/;

interface Rule {
  regex: RegExp;
  build: (match: RegExpMatchArray) => MessageSegment;
}

const RULES: Rule[] = [
  {
    regex: COLOR_RE,
    build: (m) => ({
      kind: 'color',
      token: (m[1] ?? 'primary') as ColorToken,
      children: parseMessageBody(m[2] ?? ''),
    }),
  },
  { regex: CODE_RE, build: (m) => ({ kind: 'code', text: m[1] ?? '' }) },
  { regex: BOLD_RE, build: (m) => ({ kind: 'bold', children: parseMessageBody(m[1] ?? '') }) },
  { regex: ITALIC_RE, build: (m) => ({ kind: 'italic', children: parseMessageBody(m[1] ?? '') }) },
  { regex: STRIKE_RE, build: (m) => ({ kind: 'strike', children: parseMessageBody(m[1] ?? '') }) },
];

/**
 * Recorre el texto buscando, en cada vuelta, el marcador que empieza antes —
 * entre los cinco tipos—, lo convierte y sigue con lo que queda detrás. Un
 * marcador sin cerrar no encuentra pareja: se queda como texto plano, no
 * revienta nada.
 */
export function parseMessageBody(body: string): MessageSegment[] {
  if (!body) return [];

  let earliest: { index: number; match: RegExpMatchArray; build: Rule['build'] } | null = null;

  for (const rule of RULES) {
    const match = body.match(rule.regex);
    if (!match || match.index === undefined) continue;
    if (!earliest || match.index < earliest.index) {
      earliest = { index: match.index, match, build: rule.build };
    }
  }

  if (!earliest) return [{ kind: 'text', text: body }];

  const before = body.slice(0, earliest.index);
  const after = body.slice(earliest.index + earliest.match[0].length);

  const segments: MessageSegment[] = [];
  if (before) segments.push({ kind: 'text', text: before });
  segments.push(earliest.build(earliest.match));
  segments.push(...parseMessageBody(after));

  return segments;
}

export interface WrappedSelection {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

/**
 * Envuelve lo seleccionado del `Textarea` del compositor entre `before` y
 * `after` (negrita, color…), y deja la selección donde estaba para poder
 * seguir escribiendo o cambiar de opinión sin buscar el cursor a mano.
 */
export function wrapSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after: string = before,
): WrappedSelection {
  const selected = value.slice(selectionStart, selectionEnd);
  const next =
    value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd);

  return {
    value: next,
    selectionStart: selectionStart + before.length,
    selectionEnd: selectionStart + before.length + selected.length,
  };
}
