/**
 * Convierte errores técnicos de Supabase (Auth o Postgres/PostgREST) en un
 * mensaje entendible para el usuario final.
 *
 * El error TÉCNICO completo siempre se imprime en la consola del navegador
 * (F12 → Console) para que tú, como developer, puedas ver exactamente qué
 * pasó (status, code, detalles, hint) — el usuario nunca ve eso, solo el
 * mensaje traducido.
 */
export function getFriendlyErrorMessage(error: unknown): string {
  // Log completo para debugging - esto es lo que TÚ revisas en consola
  console.error('[Error real]', error);

  const err = error as { message?: string; code?: string; status?: number };
  const rawMessage = err?.message ?? '';
  const code = err?.code ?? err?.status;

  // --- Errores de autenticación (Supabase Auth) ---
  if (rawMessage.includes('sending confirmation email')) {
    return 'No se pudo completar el registro por un problema de configuración del servidor. Avisa al equipo técnico (código: EMAIL_CONFIG).';
  }
  if (rawMessage.includes('Invalid login credentials')) {
    return 'El correo o la contraseña no son correctos.';
  }
  if (rawMessage.toLowerCase().includes('already registered')) {
    return 'Ya existe una cuenta con ese correo. Intenta iniciar sesión.';
  }
  if (rawMessage.includes('Email not confirmed')) {
    return 'Tu correo todavía no ha sido confirmado.';
  }
  if (rawMessage.toLowerCase().includes('password') && rawMessage.includes('6')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }

  // --- Errores de la base de datos (códigos estándar de Postgres/PostgREST) ---
  if (code === '42501') {
    return 'No tienes permiso para realizar esta acción.';
  }
  if (code === '23505') {
    return 'Ya existe un registro con esos datos.';
  }
  if (code === '23503') {
    return 'Falta información relacionada necesaria para completar la acción.';
  }

  // --- Error de red (servidor apagado, sin conexión, etc.) ---
  if (error instanceof TypeError && rawMessage.toLowerCase().includes('fetch')) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión o que el servidor esté encendido.';
  }

  // --- Cualquier otro caso no mapeado todavía ---
  return `Ocurrió un error inesperado${code ? ` (código ${code})` : ''}. Revisa la consola para más detalles.`;
}