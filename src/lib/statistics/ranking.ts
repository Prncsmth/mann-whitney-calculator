import type { GroupId, RankedObservation, RankingResult, TieGroup } from "@/types/statistics";

/**
 * Pools both groups, sorts ascending, and assigns ranks starting at 1.
 * Tied values receive the average of the positions they occupy.
 *
 * Example: 10, 12, 12, 15 → ranks 1, 2.5, 2.5, 4.
 *
 * Ranks are also stored doubled (2 × rank) so every rank is an integer.
 * The exact test uses those integers to avoid floating-point rounding.
 */
export function rankObservations(groupA: readonly number[], groupB: readonly number[]): RankingResult {
  const pooled: Omit<RankedObservation, "sortedPosition" | "rank" | "doubledRank" | "tied">[] = [
    ...groupA.map((value, i) => ({ id: `A${i + 1}`, group: "A" as GroupId, indexInGroup: i, value })),
    ...groupB.map((value, i) => ({ id: `B${i + 1}`, group: "B" as GroupId, indexInGroup: i, value })),
  ];

  // Array.prototype.sort is stable, so equal values keep input order (A before B).
  const order = [...pooled].sort((x, y) => x.value - y.value);

  const sorted: RankedObservation[] = [];
  const tieGroups: TieGroup[] = [];
  let tieCorrectionTerm = 0;

  let start = 0;
  while (start < order.length) {
    let end = start;
    while (end + 1 < order.length && order[end + 1].value === order[start].value) end++;

    const firstPosition = start + 1;
    const lastPosition = end + 1;
    const doubledRank = firstPosition + lastPosition;
    const count = end - start + 1;
    const tied = count > 1;

    for (let i = start; i <= end; i++) {
      sorted.push({ ...order[i], sortedPosition: i + 1, rank: doubledRank / 2, doubledRank, tied });
    }
    if (tied) {
      tieGroups.push({ value: order[start].value, count, firstPosition, lastPosition, rank: doubledRank / 2 });
      tieCorrectionTerm += count ** 3 - count;
    }
    start = end + 1;
  }

  const byInputOrder = (g: GroupId) =>
    sorted.filter((o) => o.group === g).sort((x, y) => x.indexInGroup - y.indexInGroup);

  return {
    sorted,
    groupA: byInputOrder("A"),
    groupB: byInputOrder("B"),
    tieGroups,
    tieCorrectionTerm,
    hasTies: tieGroups.length > 0,
  };
}
