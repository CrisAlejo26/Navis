/** El filete de color de la fila de móvil (RFC 0022 §3): ámbar, verde, o ninguno sin checklist. */
export function checklistBorder(checklist: { checked: number; total: number } | null): string {
  if (!checklist) return 'border-l-border';
  return checklist.checked === checklist.total ? 'border-l-success' : 'border-l-warning';
}
