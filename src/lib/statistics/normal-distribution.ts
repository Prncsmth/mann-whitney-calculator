/**
 * Standard normal distribution functions.
 *
 * erfc is computed with:
 *  - a positive-term power series for erf when 0 ≤ x < 2.5 (no cancellation), and
 *  - a continued fraction (modified Lentz method) for x ≥ 2.5.
 * This keeps good relative accuracy for very small tail probabilities,
 * which matters for p-values like 0.0007.
 */

const SQRT_PI = Math.sqrt(Math.PI);
const SERIES_LIMIT = 2.5;
const TINY = 1e-300;
const EPS = 1e-16;

function erfSeries(x: number): number {
  // erf(x) = (2/√π) e^{-x²} Σ x·(2x²)^n / (1·3·5···(2n+1))
  const twoX2 = 2 * x * x;
  let term = x;
  let sum = x;
  for (let n = 1; n < 500; n++) {
    term *= twoX2 / (2 * n + 1);
    sum += term;
    if (term < sum * EPS) break;
  }
  return (2 / SQRT_PI) * Math.exp(-x * x) * sum;
}

function erfcContinuedFraction(x: number): number {
  // erfc(x) = (e^{-x²}/√π) · 1/(x + (1/2)/(x + 1/(x + (3/2)/(x + 2/(x + ...)))))
  let f = x;
  let C = x;
  let D = 0;
  for (let k = 1; k < 1000; k++) {
    const a = k / 2;
    D = x + a * D;
    D = Math.abs(D) < TINY ? TINY : D;
    C = x + a / C;
    C = Math.abs(C) < TINY ? TINY : C;
    D = 1 / D;
    const delta = C * D;
    f *= delta;
    if (Math.abs(delta - 1) < EPS) break;
  }
  return Math.exp(-x * x) / (SQRT_PI * f);
}

/** Complementary error function erfc(x) = 1 − erf(x). */
export function erfc(x: number): number {
  if (Number.isNaN(x)) return NaN;
  if (x < 0) return 2 - erfc(-x);
  if (x < SERIES_LIMIT) return 1 - erfSeries(x);
  return erfcContinuedFraction(x);
}

/** P(Z ≤ z) for a standard normal Z. */
export function normalCdf(z: number): number {
  return 0.5 * erfc(-z / Math.SQRT2);
}

/** P(Z ≥ z) for a standard normal Z (upper tail). */
export function normalSf(z: number): number {
  return 0.5 * erfc(z / Math.SQRT2);
}
