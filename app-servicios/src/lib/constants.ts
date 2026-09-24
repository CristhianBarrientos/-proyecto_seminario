/**
 * price_unit en la tabla `services` es `text` libre (sin CHECK constraint,
 * ver sql_docker/schema-inicial.sql:75) - esta lista es la única fuente de
 * verdad del lado del frontend para qué valores son válidos, en vez de tener
 * los mismos 4 strings repetidos sueltos en cada lugar que arma el dropdown.
 */
export const PRICE_UNITS = [
  { value: 'servicio', label: 'Por servicio' },
  { value: 'hora', label: 'Por hora' },
  { value: 'dia', label: 'Por día' },
  { value: 'm2', label: 'Por m²' },
] as const;

export type PriceUnit = (typeof PRICE_UNITS)[number]['value'];

export const DEFAULT_PRICE_UNIT: PriceUnit = 'servicio';
