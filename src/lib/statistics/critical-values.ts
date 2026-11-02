import type { Alternative, CriticalValueResult, ExactDistribution } from "@/types/statistics";
import { exactNullDistribution, PROBABILITY_TOLERANCE } from "./exact-test";

export const CRITICAL_VALUE_UNAVAILABLE =
  "Critical value unavailable for this configuration. Use the p-value decision.";

const formatU = (doubled: number) => String(doubled / 2);

/**
 * Critical value from an exact null distribution of 2·U1.
 *
 *   two-sided: largest c with P(min(U1, U2) ≤ c) ≤ α   → reject H₀ if U ≤ c
 *   less:      largest c with P(U1 ≤ c) ≤ α            → reject H₀ if U1 ≤ c
 *   greater:   largest c with P(U2 ≤ c) ≤ α            → reject H₀ if U2 ≤ c
 *
 * These rules match the exact p-value conventions in exact-test.ts, so
 * "statistic ≤ c" and "exact p ≤ α" always give the same decision.
 */
export function criticalValueFromDistribution(
  distribution: ExactDistribution,
  n1: number,
  n2: number,
  alpha: number,
  alternative: Alternative,
): CriticalValueResult {
  const doubledProduct = n1 * n2; // 2·U1 + 2·U2 = 2·n1·n2, and 2·E[U] = n1·n2

  // Doubled statistic whose small values lead to rejection, mapped from 2·U1.
  const toStatistic = (doubledU1: number): number => {
    if (alternative === "less") return doubledU1;
    if (alternative === "greater") return 2 * doubledProduct - doubledU1; // 2·U2
    return Math.min(doubledU1, 2 * doubledProduct - doubledU1); // 2·min(U1, U2)
  };

  const byValue = new Map<number, number>();
  distribution.doubledU1.forEach((u, i) => {
    const s = toStatistic(u);
    byValue.set(s, (byValue.get(s) ?? 0) + distribution.probabilities[i]);
  });
  const support = [...byValue.keys()].sort((a, b) => a - b);

  let cumulative = 0;
  let best: { doubled: number; attained: number } | null = null;
  for (const s of support) {
    cumulative += byValue.get(s)!;
    if (cumulative <= alpha + PROBABILITY_TOLERANCE) best = { doubled: s, attained: Math.min(1, cumulative) };
    else break;
  }

  if (!best) return { available: false, message: CRITICAL_VALUE_UNAVAILABLE };

  const statistic = alternative === "less" ? "U1" : alternative === "greater" ? "U2" : "U";
  const value = best.doubled / 2;
  return {
    available: true,
    statistic,
    value,
    attainedAlpha: best.attained,
    rule: `Reject H₀ if ${statistic} ≤ ${formatU(best.doubled)}`,
  };
}

/** Critical value for the observed data (tie-aware), or unavailable if exact is infeasible. */
export function exactCriticalValue(
  distribution: ExactDistribution | null,
  n1: number,
  n2: number,
  alpha: number,
  alternative: Alternative,
): CriticalValueResult {
  if (!distribution) return { available: false, message: CRITICAL_VALUE_UNAVAILABLE };
  return criticalValueFromDistribution(distribution, n1, n2, alpha, alternative);
}

/**
 * Conventional table critical value: the exact distribution assuming NO ties
 * (ranks 1..N). Computed, not looked up. Reference only when the data has ties.
 */
export function conventionalCriticalValue(
  n1: number,
  n2: number,
  alpha: number,
  alternative: Alternative,
): CriticalValueResult {
  const N = n1 + n2;
  const doubledRanks = Array.from({ length: N }, (_, i) => 2 * (i + 1));
  const distribution = exactNullDistribution(doubledRanks, n1);
  return exactCriticalValue(distribution, n1, n2, alpha, alternative);
}
