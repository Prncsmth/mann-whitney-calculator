import type {
  ExactDistribution,
  ExactTestInfeasible,
  ExactTestResult,
  PValues,
} from "@/types/statistics";

/**
 * Exact conditional permutation test for the Mann–Whitney U statistic.
 *
 * Under H0 every way of splitting the N pooled observations into a group of
 * size n1 and a group of size n2 is equally likely. The observed average ranks
 * (including tied ranks) are kept fixed, so ties are handled exactly.
 *
 * Instead of listing all C(N, n1) splits one by one, we count how many splits
 * give each possible rank sum with dynamic programming. The counts are the same
 * as full enumeration, but the work grows with N·k·(range of sums) instead of
 * C(N, n1), so samples of 100+ observations stay fast.
 *
 * Ranks are doubled so they are integers and comparisons are exact.
 *
 * P-value conventions (U1 = U for Group A, E[U] = n1·n2/2):
 *   less       ("A less than B"):    P(U1 ≤ u1_obs)
 *   greater    ("A greater than B"): P(U1 ≥ u1_obs)
 *   two-sided:                       P(|U1 − E[U]| ≥ |u1_obs − E[U]|)
 * The two-sided value counts outcomes at least as extreme as the observed one
 * in either direction. It is NOT computed by doubling a one-sided p-value.
 */

/**
 * Upper bound on the work estimate (keeps the browser responsive).
 * Measured on a laptop: 60+60 ≈ 60 ms, 75+75 ≈ 130 ms (just under this limit).
 */
export const EXACT_WORK_LIMIT = 200_000_000;

/** Probability comparisons allow for floating-point rounding in summed probabilities. */
export const PROBABILITY_TOLERANCE = 1e-12;

function largestSum(doubledRanks: readonly number[], k: number): number {
  return [...doubledRanks].sort((a, b) => b - a).slice(0, k).reduce((s, d) => s + d, 0);
}

/** Estimated work for the exact distribution, used to decide feasibility. */
export function estimateExactWork(doubledRanks: readonly number[], n1: number): number {
  const N = doubledRanks.length;
  const k = Math.min(n1, N - n1);
  return N * k * (largestSum(doubledRanks, k) + 1);
}

/**
 * Exact null distribution of 2·U1 given the pooled doubled ranks.
 * Returns null when the work estimate exceeds the limit.
 */
export function exactNullDistribution(
  doubledRanks: readonly number[],
  n1: number,
  workLimit: number = EXACT_WORK_LIMIT,
): ExactDistribution | null {
  const N = doubledRanks.length;
  const n2 = N - n1;
  if (n1 < 1 || n2 < 1) throw new Error("Both groups need at least one observation.");
  if (estimateExactWork(doubledRanks, n1) > workLimit) return null;

  // Count subsets of the smaller size k (fewer DP layers), then map back to Group A.
  const k = Math.min(n1, n2);
  const countingGroupA = k === n1;
  const maxSum = largestSum(doubledRanks, k);

  // dp[j][s] = number of j-element subsets (of items seen so far) with doubled-rank sum s.
  const dp: Float64Array[] = Array.from({ length: k + 1 }, () => new Float64Array(maxSum + 1));
  dp[0][0] = 1;
  let reach = 0; // largest sum reachable so far
  doubledRanks.forEach((d, i) => {
    reach = Math.min(maxSum, reach + d);
    for (let j = Math.min(i + 1, k); j >= 1; j--) {
      const prev = dp[j - 1];
      const cur = dp[j];
      for (let s = reach; s >= d; s--) {
        const add = prev[s - d];
        if (add !== 0) cur[s] += add;
      }
    }
  });

  const totalDoubledRanks = doubledRanks.reduce((s, d) => s + d, 0);
  const n1Offset = n1 * (n1 + 1); // 2 · n1(n1 + 1)/2
  const counts = dp[k];
  let total = 0;
  for (let s = 0; s <= maxSum; s++) total += counts[s];

  const byDoubledU1 = new Map<number, number>();
  for (let s = 0; s <= maxSum; s++) {
    if (counts[s] === 0) continue;
    const doubledR1 = countingGroupA ? s : totalDoubledRanks - s;
    const doubledU1 = doubledR1 - n1Offset;
    byDoubledU1.set(doubledU1, (byDoubledU1.get(doubledU1) ?? 0) + counts[s] / total);
  }

  const doubledU1 = [...byDoubledU1.keys()].sort((a, b) => a - b);
  return {
    doubledU1,
    probabilities: doubledU1.map((u) => byDoubledU1.get(u)!),
    totalAssignments: total,
  };
}

const clamp01 = (p: number) => Math.min(1, Math.max(0, p));

/** One- and two-sided exact p-values for an observed U1. */
export function exactPValues(distribution: ExactDistribution, U1: number, n1: number, n2: number): PValues {
  const observed = Math.round(2 * U1);
  const doubledMean = n1 * n2; // 2 · E[U]
  const observedDistance = Math.abs(observed - doubledMean);

  let less = 0;
  let greater = 0;
  let twoSided = 0;
  distribution.doubledU1.forEach((u, i) => {
    const p = distribution.probabilities[i];
    if (u <= observed) less += p;
    if (u >= observed) greater += p;
    if (Math.abs(u - doubledMean) >= observedDistance) twoSided += p;
  });

  return { less: clamp01(less), greater: clamp01(greater), twoSided: clamp01(twoSided) };
}

export function runExactTest(
  doubledRanks: readonly number[],
  n1: number,
  U1: number,
  workLimit: number = EXACT_WORK_LIMIT,
): ExactTestResult | ExactTestInfeasible {
  const distribution = exactNullDistribution(doubledRanks, n1, workLimit);
  if (!distribution) {
    return {
      feasible: false,
      reason:
        "The exact permutation distribution is too large to compute quickly in the browser for these sample sizes.",
      estimatedWork: estimateExactWork(doubledRanks, n1),
      workLimit,
    };
  }
  const n2 = doubledRanks.length - n1;
  return { feasible: true, distribution, pValues: exactPValues(distribution, U1, n1, n2) };
}
