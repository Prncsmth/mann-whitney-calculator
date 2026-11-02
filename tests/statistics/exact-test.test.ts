import { describe, expect, it } from "vitest";
import { exactNullDistribution, runExactTest } from "@/lib/statistics/exact-test";
import { rankObservations } from "@/lib/statistics/ranking";
import { computeUStatistics } from "@/lib/statistics/u-statistic";
import { SAMPLE_INPUT } from "@/constants/sample-data";
import { mulberry32, randomSample, referenceExactPValues } from "./reference";

function exactFor(a: number[], b: number[], workLimit?: number) {
  const ranking = rankObservations(a, b);
  const u = computeUStatistics(ranking);
  const doubled = [...ranking.groupA, ...ranking.groupB].map((o) => o.doubledRank);
  return runExactTest(doubled, a.length, u.U1, workLimit);
}

describe("exact permutation test", () => {
  it("gives the textbook no-ties results (complete separation)", () => {
    const r1 = exactFor([1, 2, 3], [4, 5, 6]);
    if (!r1.feasible) throw new Error("expected feasible");
    expect(r1.distribution.totalAssignments).toBe(20);
    expect(r1.pValues.less).toBeCloseTo(1 / 20, 14);
    expect(r1.pValues.twoSided).toBeCloseTo(2 / 20, 14);
    expect(r1.pValues.greater).toBeCloseTo(1, 14);

    const r2 = exactFor([1, 2, 3, 4, 5], [6, 7, 8, 9, 10]);
    if (!r2.feasible) throw new Error("expected feasible");
    expect(r2.pValues.twoSided).toBeCloseTo(2 / 252, 14);
  });

  it("matches full enumeration of all 184,756 splits for the sample dataset (with ties)", () => {
    const r = exactFor(SAMPLE_INPUT.groupA.values, SAMPLE_INPUT.groupB.values);
    if (!r.feasible) throw new Error("expected feasible");
    expect(r.distribution.totalAssignments).toBe(184756);
    // Values from an independent brute-force enumeration script.
    expect(r.pValues.twoSided).toBeCloseTo(0.00023815194093831864, 14);
    expect(r.pValues.less).toBeCloseTo(0.00011907597046915932, 14);
    expect(r.pValues.greater).toBeCloseTo(0.9999512871029899, 12);
  });

  it("matches the brute-force reference on random datasets with heavy ties and unequal sizes", () => {
    const rand = mulberry32(2024);
    for (let t = 0; t < 120; t++) {
      const n1 = 1 + Math.floor(rand() * 7);
      const n2 = 1 + Math.floor(rand() * 7);
      const range = 1 + Math.floor(rand() * 6); // 1 → all equal; small → many ties
      const a = randomSample(rand, n1, range);
      const b = randomSample(rand, n2, range);
      const ref = referenceExactPValues(a, b);
      const r = exactFor(a, b);
      if (!r.feasible) throw new Error("expected feasible");
      expect(r.distribution.totalAssignments).toBe(ref.total);
      expect(r.pValues.less).toBeCloseTo(ref.less, 12);
      expect(r.pValues.greater).toBeCloseTo(ref.greater, 12);
      expect(r.pValues.twoSided).toBeCloseTo(ref.twoSided, 12);
      // Same distribution, value by value.
      r.distribution.doubledU1.forEach((du, i) => {
        expect(r.distribution.probabilities[i]).toBeCloseTo((ref.distribution.get(du / 2) ?? 0) / ref.total, 12);
      });
    }
  });

  it("matches the reference for decimal and negative values", () => {
    const a = [-2.5, 0.1, 0.1, 3.75, -7];
    const b = [0.1, 4.2, 5, -2.5, 6.6, 9];
    const ref = referenceExactPValues(a, b);
    const r = exactFor(a, b);
    if (!r.feasible) throw new Error("expected feasible");
    expect(r.pValues.twoSided).toBeCloseTo(ref.twoSided, 12);
    expect(r.pValues.less).toBeCloseTo(ref.less, 12);
  });

  it("produces a valid probability distribution (sums to 1, p-values in [0, 1])", () => {
    const rand = mulberry32(99);
    for (let t = 0; t < 30; t++) {
      const a = randomSample(rand, 1 + Math.floor(rand() * 30), 10);
      const b = randomSample(rand, 1 + Math.floor(rand() * 30), 10);
      const r = exactFor(a, b);
      if (!r.feasible) throw new Error("expected feasible");
      const sum = r.distribution.probabilities.reduce((s, p) => s + p, 0);
      expect(sum).toBeCloseTo(1, 12);
      for (const p of Object.values(r.pValues)) {
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
      }
    }
  });

  it("gives p = 1 when every observation is identical (zero variance)", () => {
    const r = exactFor([5, 5, 5], [5, 5]);
    if (!r.feasible) throw new Error("expected feasible");
    expect(r.pValues).toEqual({ less: 1, greater: 1, twoSided: 1 });
  });

  it("reports infeasible instead of running forever when over the work limit", () => {
    const r = exactFor([1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12], 10);
    expect(r.feasible).toBe(false);
    if (!r.feasible) expect(r.estimatedWork).toBeGreaterThan(r.workLimit);
  });

  it("stays fast for a large but manageable dataset (n1 = n2 = 60)", () => {
    const rand = mulberry32(5);
    const a = randomSample(rand, 60, 1000);
    const b = randomSample(rand, 60, 1000, 100);
    const start = performance.now();
    const r = exactFor(a, b);
    expect(r.feasible).toBe(true);
    expect(performance.now() - start).toBeLessThan(5000);
  });

  it("is symmetric about E[U] when there are no ties", () => {
    const N = 15;
    const d = exactNullDistribution(Array.from({ length: N }, (_, i) => 2 * (i + 1)), 6)!;
    const n1n2 = 6 * 9;
    d.doubledU1.forEach((du, i) => {
      const mirror = d.doubledU1.indexOf(2 * n1n2 - du);
      expect(d.probabilities[mirror]).toBeCloseTo(d.probabilities[i], 14);
    });
  });
});
