import { describe, expect, it } from "vitest";
import { rankObservations } from "@/lib/statistics/ranking";
import { computeUStatistics } from "@/lib/statistics/u-statistic";
import { SAMPLE_INPUT } from "@/constants/sample-data";
import { mulberry32, randomSample, referenceRanks, referenceU1 } from "./reference";

const A = SAMPLE_INPUT.groupA.values;
const B = SAMPLE_INPUT.groupB.values;

describe("ranking", () => {
  it("assigns average ranks to ties (spec example 10, 12, 12, 15)", () => {
    const r = rankObservations([10, 12], [12, 15]);
    expect(r.sorted.map((o) => o.value)).toEqual([10, 12, 12, 15]);
    expect(r.sorted.map((o) => o.rank)).toEqual([1, 2.5, 2.5, 4]);
    expect(r.tieGroups).toEqual([{ value: 12, count: 2, firstPosition: 2, lastPosition: 3, rank: 2.5 }]);
    expect(r.tieCorrectionTerm).toBe(6);
  });

  it("preserves group membership and input order", () => {
    const r = rankObservations([5, 1], [3]);
    expect(r.groupA.map((o) => [o.id, o.value, o.rank])).toEqual([["A1", 5, 3], ["A2", 1, 1]]);
    expect(r.groupB.map((o) => [o.id, o.value, o.rank])).toEqual([["B1", 3, 2]]);
  });

  it("ranks the sample dataset correctly", () => {
    const r = rankObservations(A, B);
    // Ties: 12×2, 14×3, 15×2, 16×2, 17×2, 18×2 → Σ(t³−t) = 6 + 24 + 6·4 = 54
    expect(r.tieCorrectionTerm).toBe(54);
    expect(r.tieGroups.map((t) => [t.value, t.count, t.rank])).toEqual([
      [12, 2, 4.5],
      [14, 3, 8],
      [15, 2, 10.5],
      [16, 2, 12.5],
      [17, 2, 14.5],
      [18, 2, 16.5],
    ]);
    expect(r.groupA.map((o) => o.rank)).toEqual([4.5, 10.5, 3, 8, 2, 6, 12.5, 1, 4.5, 8]);
    expect(r.groupB.map((o) => o.rank)).toEqual([16.5, 12.5, 19, 10.5, 18, 14.5, 20, 8, 16.5, 14.5]);
  });

  it("handles decimals and negative values", () => {
    const r = rankObservations([-1.5, 0.25, 2.75], [-1.5, 3, -10]);
    expect(r.groupA.map((o) => o.rank)).toEqual([2.5, 4, 5]);
    expect(r.groupB.map((o) => o.rank)).toEqual([2.5, 6, 1]);
  });

  it("matches the independent reference ranks on random data with ties", () => {
    const rand = mulberry32(42);
    for (let t = 0; t < 200; t++) {
      const a = randomSample(rand, 1 + Math.floor(rand() * 15), 8, -3);
      const b = randomSample(rand, 1 + Math.floor(rand() * 15), 8, -3);
      const r = rankObservations(a, b);
      const ref = referenceRanks([...a, ...b]);
      expect([...r.groupA, ...r.groupB].map((o) => o.rank)).toEqual(ref);
    }
  });
});

describe("U statistics", () => {
  it("reproduces the verified sample values", () => {
    const u = computeUStatistics(rankObservations(A, B));
    expect(u).toMatchObject({ n1: 10, n2: 10, N: 20, R1: 60, R2: 150, U1: 5, U2: 95, U: 5 });
    expect(u.R1 + u.R2).toBe(210);
    expect(u.meanRankA).toBe(6);
    expect(u.meanRankB).toBe(15);
  });

  it("satisfies R1 + R2 = N(N+1)/2, U1 + U2 = n1·n2, U = min, and U1 = pair count (random, unequal sizes)", () => {
    const rand = mulberry32(7);
    for (let t = 0; t < 300; t++) {
      const a = randomSample(rand, 1 + Math.floor(rand() * 25), 1 + Math.floor(rand() * 30));
      const b = randomSample(rand, 1 + Math.floor(rand() * 25), 1 + Math.floor(rand() * 30));
      const u = computeUStatistics(rankObservations(a, b));
      expect(u.R1 + u.R2).toBe((u.N * (u.N + 1)) / 2);
      expect(u.U1 + u.U2).toBe(u.n1 * u.n2);
      expect(u.U).toBe(Math.min(u.U1, u.U2));
      expect(u.U1).toBeCloseTo(referenceU1(a, b), 10);
    }
  });

  it("works for the smallest possible groups (n1 = n2 = 1)", () => {
    const u = computeUStatistics(rankObservations([3], [7]));
    expect(u).toMatchObject({ R1: 1, R2: 2, U1: 0, U2: 1, U: 0 });
  });
});
