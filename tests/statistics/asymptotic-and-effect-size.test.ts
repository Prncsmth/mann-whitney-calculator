import { describe, expect, it } from "vitest";
import { runAsymptoticTest } from "@/lib/statistics/asymptotic-test";
import { computeEffectSizes, magnitudeLabel } from "@/lib/statistics/effect-size";

// Sample dataset: U1 = 5, n1 = n2 = 10, Σ(t³ − t) = 54.
const sample = { U1: 5, n1: 10, n2: 10, tieCorrectionTerm: 54 };
const expectedVariance = (100 / 12) * (21 - 54 / 380); // 173.8157894...

describe("asymptotic (normal) approximation", () => {
  it("computes mean, tie-corrected variance and z for the sample", () => {
    const r = runAsymptoticTest({ ...sample, alternative: "two-sided", continuityCorrection: true });
    if (!r.computable) throw new Error("expected computable");
    expect(r.mean).toBe(50);
    expect(r.variance).toBeCloseTo(expectedVariance, 10);
    expect(r.varianceWithoutTieCorrection).toBeCloseTo(175, 10);
    expect(r.zUncorrected).toBeCloseTo(-45 / Math.sqrt(expectedVariance), 12);
    expect(r.z).toBeCloseTo(-44.5 / Math.sqrt(expectedVariance), 12);
    expect(r.correctionApplied).toBe(-0.5);
    expect(r.warnings).toEqual([]);
  });

  it("gives the classroom two-sided p ≈ 0.00074 with continuity correction", () => {
    const r = runAsymptoticTest({ ...sample, alternative: "two-sided", continuityCorrection: true });
    if (!r.computable) throw new Error("expected computable");
    expect(r.z).toBeCloseTo(-3.3753, 4);
    expect(r.pValue).toBeCloseTo(7.3729e-4, 7);
  });

  it("gives p ≈ 0.00064 without continuity correction", () => {
    const r = runAsymptoticTest({ ...sample, alternative: "two-sided", continuityCorrection: false });
    if (!r.computable) throw new Error("expected computable");
    expect(r.z).toBeCloseTo(-3.4132, 4);
    expect(r.pValue).toBeCloseTo(6.4193e-4, 7);
  });

  it("handles one-sided alternatives with the correction toward the null", () => {
    const less = runAsymptoticTest({ ...sample, alternative: "less", continuityCorrection: true });
    const greater = runAsymptoticTest({ ...sample, alternative: "greater", continuityCorrection: true });
    if (!less.computable || !greater.computable) throw new Error("expected computable");
    expect(less.correctionApplied).toBe(-0.5);
    expect(greater.correctionApplied).toBe(0.5);
    expect(less.pValue).toBeCloseTo(7.3729e-4 / 2, 7);
    // greater: z = (5 − 50 − 0.5)/σ
    expect(greater.z).toBeCloseTo(-45.5 / Math.sqrt(expectedVariance), 12);
    expect(greater.pValue).toBeGreaterThan(0.999);
  });

  it("returns p = 1 (not above 1) when U1 equals its mean", () => {
    const r = runAsymptoticTest({ U1: 50, n1: 10, n2: 10, tieCorrectionTerm: 0, alternative: "two-sided", continuityCorrection: true });
    if (!r.computable) throw new Error("expected computable");
    expect(r.z).toBe(0);
    expect(r.pValue).toBe(1);
  });

  it("reports not computable when the variance is zero (all values tied)", () => {
    // n1 = 3, n2 = 2, all equal: t = 5 → Σ(t³ − t) = 120 = N(N−1)(N+1)
    const r = runAsymptoticTest({ U1: 3, n1: 3, n2: 2, tieCorrectionTerm: 120, alternative: "two-sided", continuityCorrection: true });
    expect(r.computable).toBe(false);
  });

  it("warns that the approximation may be inaccurate for small samples", () => {
    const r = runAsymptoticTest({ U1: 2, n1: 4, n2: 12, tieCorrectionTerm: 0, alternative: "two-sided", continuityCorrection: true });
    if (!r.computable) throw new Error("expected computable");
    expect(r.warnings.length).toBe(1);
  });
});

describe("effect sizes", () => {
  it("computes rank-biserial and r for the sample with the documented sign convention", () => {
    const z = -45 / Math.sqrt(expectedVariance);
    const e = computeEffectSizes({ U1: 5, U2: 95, n1: 10, n2: 10, zUncorrected: z });
    expect(e.rankBiserial).toBeCloseTo(-0.9, 14); // negative → Group B tends higher
    expect(e.r).toBeCloseTo(-0.76322, 4);
    expect(e.rankBiserialMagnitude).toBe("large");
    expect(e.rMagnitude).toBe("large");
  });

  it("is positive when Group A tends higher and null r when variance is zero", () => {
    const e = computeEffectSizes({ U1: 80, U2: 20, n1: 10, n2: 10, zUncorrected: null });
    expect(e.rankBiserial).toBeCloseTo(0.6, 14);
    expect(e.r).toBeNull();
  });

  it("labels magnitudes with Cohen's thresholds", () => {
    expect(magnitudeLabel(0.05)).toBe("negligible");
    expect(magnitudeLabel(-0.1)).toBe("small");
    expect(magnitudeLabel(0.3)).toBe("medium");
    expect(magnitudeLabel(-0.5)).toBe("large");
  });
});
