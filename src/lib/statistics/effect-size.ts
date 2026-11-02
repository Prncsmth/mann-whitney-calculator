import type { EffectSizes, MagnitudeLabel } from "@/types/statistics";

/**
 * Effect sizes for the Mann–Whitney U test.
 *
 * Sign convention (both measures): POSITIVE means Group A tends to have higher
 * values than Group B; NEGATIVE means Group B tends to have higher values.
 *
 *   Rank-biserial correlation:  r_rb = (U1 − U2) / (n1·n2)       range −1 … +1
 *   r:                          r    = z / √N                     z = (U1 − n1·n2/2) / σ
 *
 * z here is the UNCORRECTED z (no continuity correction), with σ including the
 * tie correction. Both describe the separation between the two samples observed
 * in this data; they do not show causation.
 *
 * Magnitude labels use Cohen's (1988) thresholds for correlations, applied to
 * the absolute value: < 0.1 negligible, < 0.3 small, < 0.5 medium, ≥ 0.5 large.
 */
export function magnitudeLabel(value: number): MagnitudeLabel {
  const a = Math.abs(value);
  if (a < 0.1) return "negligible";
  if (a < 0.3) return "small";
  if (a < 0.5) return "medium";
  return "large";
}

export function computeEffectSizes(params: {
  U1: number;
  U2: number;
  n1: number;
  n2: number;
  zUncorrected: number | null;
}): EffectSizes {
  const { U1, U2, n1, n2, zUncorrected } = params;
  const rankBiserial = (U1 - U2) / (n1 * n2);
  const r = zUncorrected === null ? null : zUncorrected / Math.sqrt(n1 + n2);
  return {
    rankBiserial,
    rankBiserialMagnitude: magnitudeLabel(rankBiserial),
    r,
    rMagnitude: r === null ? null : magnitudeLabel(r),
  };
}
