import type {
  Alternative,
  AsymptoticTestNotComputable,
  AsymptoticTestResult,
} from "@/types/statistics";
import { normalCdf, normalSf } from "./normal-distribution";

/** Below this size in either group the normal approximation may be inaccurate. */
export const SMALL_SAMPLE_THRESHOLD = 10;

/**
 * Normal (asymptotic) approximation for the Mann–Whitney U test.
 *
 *   E[U]   = n1·n2 / 2
 *   Var[U] = (n1·n2 / 12) · [ (N + 1) − Σ(t³ − t) / (N(N − 1)) ]   (tie-corrected)
 *   z      = (U1 − E[U] − c) / σ
 *
 * The continuity correction c moves U1 − E[U] 0.5 toward zero for the selected
 * alternative (the same convention as R's wilcox.test with correct = TRUE):
 *   two-sided: c = 0.5 · sign(U1 − E[U]),  p = 2 · min(Φ(z), 1 − Φ(z))
 *   greater:   c = +0.5,                    p = 1 − Φ(z)
 *   less:      c = −0.5,                    p = Φ(z)
 */
export function runAsymptoticTest(params: {
  U1: number;
  n1: number;
  n2: number;
  tieCorrectionTerm: number;
  alternative: Alternative;
  continuityCorrection: boolean;
}): AsymptoticTestResult | AsymptoticTestNotComputable {
  const { U1, n1, n2, tieCorrectionTerm, alternative, continuityCorrection } = params;
  const N = n1 + n2;
  const mean = (n1 * n2) / 2;
  const varianceWithoutTieCorrection = (n1 * n2 * (N + 1)) / 12;
  const variance = N > 1 ? ((n1 * n2) / 12) * (N + 1 - tieCorrectionTerm / (N * (N - 1))) : 0;

  // Guard against tiny negative values from rounding when all values are tied.
  if (!(variance > 1e-12)) {
    return {
      computable: false,
      reason:
        "The variance of U is zero because every observation has the same value, so the normal approximation cannot be calculated.",
    };
  }

  const sd = Math.sqrt(variance);
  const diff = U1 - mean;

  let correctionApplied = 0;
  if (continuityCorrection) {
    if (alternative === "two-sided") correctionApplied = 0.5 * Math.sign(diff);
    else if (alternative === "greater") correctionApplied = 0.5;
    else correctionApplied = -0.5;
  }

  const z = (diff - correctionApplied) / sd;
  let pValue: number;
  if (alternative === "two-sided") pValue = 2 * Math.min(normalCdf(z), normalSf(z));
  else if (alternative === "greater") pValue = normalSf(z);
  else pValue = normalCdf(z);

  const warnings: string[] = [];
  if (n1 < SMALL_SAMPLE_THRESHOLD || n2 < SMALL_SAMPLE_THRESHOLD) {
    warnings.push(
      `At least one group has fewer than ${SMALL_SAMPLE_THRESHOLD} observations, so the normal approximation may be inaccurate. Consider the exact method.`,
    );
  }

  return {
    computable: true,
    mean,
    variance,
    varianceWithoutTieCorrection,
    standardDeviation: sd,
    zUncorrected: diff / sd,
    z,
    continuityCorrection,
    correctionApplied,
    pValue: Math.min(1, Math.max(0, pValue)),
    warnings,
  };
}
