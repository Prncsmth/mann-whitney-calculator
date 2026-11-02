import type { RankingResult, UStatistics } from "@/types/statistics";

/**
 * Rank sums and U statistics, using the standard convention:
 *
 *   U1 = R1 − n1(n1 + 1)/2      (U for Group A)
 *   U2 = R2 − n2(n2 + 1)/2      (U for Group B)
 *   U  = min(U1, U2)
 *
 * Checks: R1 + R2 = N(N + 1)/2 and U1 + U2 = n1·n2.
 */
export function computeUStatistics(ranking: RankingResult): UStatistics {
  const n1 = ranking.groupA.length;
  const n2 = ranking.groupB.length;
  const N = n1 + n2;

  // Sum doubled (integer) ranks, then halve, so sums are exact.
  const doubledR1 = ranking.groupA.reduce((s, o) => s + o.doubledRank, 0);
  const doubledR2 = ranking.groupB.reduce((s, o) => s + o.doubledRank, 0);
  const R1 = doubledR1 / 2;
  const R2 = doubledR2 / 2;

  const U1 = R1 - (n1 * (n1 + 1)) / 2;
  const U2 = R2 - (n2 * (n2 + 1)) / 2;

  const expectedRankTotal = (N * (N + 1)) / 2;
  if (R1 + R2 !== expectedRankTotal) {
    throw new Error(`Rank sum check failed: R1 + R2 = ${R1 + R2}, expected ${expectedRankTotal}.`);
  }
  if (U1 + U2 !== n1 * n2) {
    throw new Error(`U check failed: U1 + U2 = ${U1 + U2}, expected ${n1 * n2}.`);
  }

  return {
    n1,
    n2,
    N,
    R1,
    R2,
    expectedRankTotal,
    U1,
    U2,
    U: Math.min(U1, U2),
    meanRankA: R1 / n1,
    meanRankB: R2 / n2,
  };
}
