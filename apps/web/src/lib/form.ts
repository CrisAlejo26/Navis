/**
 * Un campo de `FormData` puede ser un `File`. Estas funciones se quedan solo
 * con lo que es texto, en vez de convertir a lo bruto con `String()` —que en
 * un fichero daría «[object File]»— (Regla 10).
 */
export function formText(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value : '';
}

/** Igual, pero devolviendo `undefined` cuando el campo viene vacío. */
export function optionalText(value: FormDataEntryValue | null): string | undefined {
  const text = formText(value).trim();
  return text === '' ? undefined : text;
}
