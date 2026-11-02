/** Display helpers for statistical values. */

/**
 * Formats a p-value for reports.
 * p ≥ 0.001 → 4 decimal places (0.0412); smaller → 2 significant figures (0.00074, 2.4e-7).
 */
export function formatPValue(p: number): string {
  if (!Number.isFinite(p)) return "—";
  if (p >= 0.9999) return "1.0000";
  if (p >= 0.001) return p.toFixed(4);
  if (p >= 1e-6) return p.toPrecision(2);
  if (p === 0) return "0";
  return p.toExponential(1);
}

/** Formats a number with up to `digits` decimals, dropping trailing zeros. */
export function formatNumber(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Number(value.toFixed(digits));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

/** Formats a value with a fixed number of decimals (for z, effect sizes). */
export function formatFixed(value: number, digits: number): string {
  if (!Number.isFinite(value)) return "—";
  const s = value.toFixed(digits);
  return Number(s) === 0 ? (0).toFixed(digits) : s;
}

/** Replaces a leading hyphen with a typographic minus sign (−) for display. */
export function withMinus(text: string): string {
  return text.replace(/^-/, "−");
}

/**
 * Display-only: in generated sentences, turns a hyphen that marks a negative
 * number (e.g. "= -0.90", "(-3.41") into a minus sign (−). Hyphens inside words
 * ("rank-biserial", "p-value") and ranges between digits ("2-3") are unchanged.
 */
export function typographicMinus(text: string): string {
  return text.replace(/(^|[\s(=:,;[])-(?=\.?\d)/g, "$1−");
}

/** Display a number: up to `digits` decimals and a proper minus sign. */
export function displayNumber(value: number, digits = 4): string {
  return withMinus(formatNumber(value, digits));
}

/** Alpha like 0.05 → "0.05". */
export function formatAlpha(alpha: number): string {
  return formatNumber(alpha, 6);
}
