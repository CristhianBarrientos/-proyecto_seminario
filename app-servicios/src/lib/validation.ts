/**
 * Validaciones básicas de formulario que corren ANTES de llamar al backend.
 * El objetivo es doble: mejor UX (feedback inmediato, sin ida y vuelta al
 * servidor) y una primera línea de defensa que evita mandar requests con
 * campos vacíos o mal formados a Supabase.
 *
 * Esto no reemplaza la validación del lado del servidor (constraints de
 * columnas, RLS, etc.) - es la primera capa, no la única.
 */

export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const MIN_PASSWORD_LENGTH = 6;

/**
 * Devuelve el mensaje del primer campo requerido que esté vacío, o null si
 * todos tienen valor. `fields` es un mapa { "Nombre visible": valor }.
 */
export function firstMissingField(fields: Record<string, string>): string | null {
  for (const [label, value] of Object.entries(fields)) {
    if (!value || !value.trim()) {
      return `Completá el campo "${label}".`;
    }
  }
  return null;
}

export function isPositiveNumber(value: string): boolean {
  const n = Number(value);
  return value.trim() !== '' && Number.isFinite(n) && n > 0;
}
