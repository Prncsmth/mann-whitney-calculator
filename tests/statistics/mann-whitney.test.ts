import { describe, expect, it } from "vitest";
import { analyze, DEFAULT_CONFIG } from "@/lib/statistics/mann-whitney";
import { SAMPLE_INPUT } from "@/constants/sample-data";
import type { AnalysisConfig, AnalysisInput } from "@/types/statistics";
import { mulberry32, randomSample, referenceExactPValues } from "./reference";

const input = (a: number[], b: number[]): AnalysisInput => ({
  groupA: { name: "Group A", values: a },
  groupB: { name: "Group B", values: b },
});
const config = (overrides: Partial<AnalysisConfig> = {}): AnalysisConfig => ({ ...DEFAULT_CONFIG, ...overrides });

describe("analyze — classroom sample (Traditional Lecture vs Gamified Learning)", () => {
  const result = analyze(SAMPLE_INPUT);

  it("uses the approved defaults: asymptotic, two-sided, α = 0.05, continuity correction", () => {
    expect(DEFAULT_CONFIG).toEqual({ alpha: 0.05, alternative: "two-sided", method: "asymptotic", continuityCorrection: true });
    expect(result.methodUsed).toBe("asymptotic");
  });

  it("reproduces the verified statistics", () => {
    expect(result.u).toMatchObject({ n1: 10, n2: 10, R1: 60, R2: 150, U1: 5, U2: 95, U: 5 });
  });

  it("reports headline p ≈ 0.00074 and exact p ≈ 0.00024 as secondary", () => {
    expect(result.pValue).toBeCloseTo(7.3729e-4, 7);
    expect(result.secondaryPValue?.method).toBe("exact");
    expect(result.secondaryPValue?.value).toBeCloseTo(0.00023815194093831864, 14);
  });

  it("rejects H₀", () => {
    expect(result.decision).toBe("reject");
    expect(result.interpretation.decisionStatement).toBe("Reject H₀");
  });

  it("shows 23 as the conventional no-ties reference and warns about ties", () => {
    expect(result.conventionalCriticalValue.available && result.conventionalCriticalValue.value).toBe(23);
    expect(result.ranking.hasTies).toBe(true);
    expect(result.notices.some((n) => n.level === "warning" && /tied values/.test(n.message))).toBe(true);
  });

  it("computes a tie-aware exact critical value consistent with the exact p-value", () => {
    const cv = result.criticalValue;
    expect(cv.available).toBe(true);
    if (cv.available) {
      expect(cv.statistic).toBe("U");
      expect(cv.attainedAlpha).toBeLessThanOrEqual(0.05);
      expect(result.u.U <= cv.value).toBe(true);
    }
  });

  it("computes effect sizes with the documented sign (negative → Group B higher)", () => {
    expect(result.effectSizes.rankBiserial).toBeCloseTo(-0.9, 14);
    expect(result.effectSizes.r).toBeCloseTo(-0.7632, 4);
  });

  it("writes an academic conclusion without overclaiming", () => {
    const { conclusion, alternativeHypothesis } = result.interpretation;
    expect(alternativeHypothesis).toContain("Traditional Lecture");
    expect(conclusion).toContain("statistically significant evidence of a difference between Traditional Lecture and Gamified Learning");
    expect(conclusion).toContain("Gamified Learning showed generally higher observed scores in this sample");
    expect(conclusion).toContain("U = 5");
    expect(conclusion).toContain("p = 0.00074");
    expect(conclusion).not.toMatch(/prove|superior|mean score/i);
  });

  it("reports descriptives", () => {
    expect(result.descriptives.A).toMatchObject({ n: 10, median: 12.5, min: 9, max: 16, meanRank: 6 });
    expect(result.descriptives.B).toMatchObject({ n: 10, median: 17.5, min: 14, max: 21, meanRank: 15 });
  });
});

describe("analyze — method selection", () => {
  it("Exact uses the tie-aware exact p-value", () => {
    const r = analyze(SAMPLE_INPUT, config({ method: "exact" }));
    expect(r.methodUsed).toBe("exact");
    expect(r.pValue).toBeCloseTo(0.00023815194093831864, 14);
    expect(r.secondaryPValue?.method).toBe("asymptotic");
  });

  it("Automatic chooses exact when feasible", () => {
    const r = analyze(SAMPLE_INPUT, config({ method: "automatic" }));
    expect(r.methodUsed).toBe("exact");
    expect(r.notices.some((n) => n.message.startsWith("Automatic"))).toBe(true);
  });

  it("falls back to asymptotic with a disclosed warning when exact is too large", () => {
    const r = analyze(SAMPLE_INPUT, config({ method: "exact" }), { exactWorkLimit: 10 });
    expect(r.methodUsed).toBe("asymptotic");
    expect(r.exact.feasible).toBe(false);
    expect(r.notices.some((n) => n.level === "warning" && /exact method was requested/.test(n.message))).toBe(true);
    expect(r.criticalValue.available).toBe(false);
  });

  it("handles a large dataset (n1 = n2 = 400) via automatic fallback to asymptotic", () => {
    const rand = mulberry32(11);
    const r = analyze(input(randomSample(rand, 400, 10000), randomSample(rand, 400, 10000, 300)), config({ method: "automatic" }));
    expect(r.methodUsed).toBe("asymptotic");
    expect(r.pValue).toBeGreaterThanOrEqual(0);
    expect(r.pValue).toBeLessThanOrEqual(1);
  });

  it("asymptotic and exact agree closely for moderately large samples without ties", () => {
    const rand = mulberry32(3);
    const a = Array.from({ length: 40 }, () => rand() * 100);
    const b = Array.from({ length: 45 }, () => rand() * 100 + 8);
    const exact = analyze(input(a, b), config({ method: "exact" }));
    const asym = analyze(input(a, b), config({ method: "asymptotic" }));
    expect(exact.methodUsed).toBe("exact");
    expect(Math.abs(exact.pValue! - asym.pValue!)).toBeLessThan(0.005);
  });
});

describe("analyze — alternatives, alpha and decisions", () => {
  it("one-sided 'less' (A < B) rejects for the sample; 'greater' does not", () => {
    const less = analyze(SAMPLE_INPUT, config({ alternative: "less" }));
    const greater = analyze(SAMPLE_INPUT, config({ alternative: "greater" }));
    expect(less.decision).toBe("reject");
    expect(less.interpretation.alternativeHypothesis).toContain("tend to be lower");
    expect(greater.decision).toBe("fail-to-reject");
    expect(greater.interpretation.decisionExplanation).toContain("does not prove H₀");
  });

  it("decision follows p ≤ α", () => {
    const rand = mulberry32(8);
    for (let t = 0; t < 100; t++) {
      const alpha = [0.1, 0.05, 0.01, 0.025][t % 4];
      const r = analyze(
        input(randomSample(rand, 3 + (t % 9), 12), randomSample(rand, 4 + (t % 7), 12, t % 4)),
        config({ alpha, method: t % 2 ? "exact" : "asymptotic", alternative: (["two-sided", "less", "greater"] as const)[t % 3] }),
      );
      expect(r.pValue).not.toBeNull();
      expect(r.pValue!).toBeGreaterThanOrEqual(0);
      expect(r.pValue!).toBeLessThanOrEqual(1);
      expect(r.decision).toBe(r.pValue! <= alpha ? "reject" : "fail-to-reject");
    }
  });

  it("with the exact method, the critical-value rule always agrees with the p-value decision", () => {
    const rand = mulberry32(21);
    for (let t = 0; t < 150; t++) {
      const alternative = (["two-sided", "less", "greater"] as const)[t % 3];
      const r = analyze(
        input(randomSample(rand, 2 + (t % 8), 6), randomSample(rand, 2 + (t % 6), 6, t % 3)),
        config({ method: "exact", alternative, alpha: 0.1 }),
      );
      const cv = r.criticalValue;
      if (!cv.available) {
        expect(r.decision).toBe("fail-to-reject");
        continue;
      }
      const stat = cv.statistic === "U1" ? r.u.U1 : cv.statistic === "U2" ? r.u.U2 : r.u.U;
      expect(stat <= cv.value).toBe(r.decision === "reject");
    }
  });

  it("exact p-values from analyze match brute-force enumeration (unequal sizes, ties)", () => {
    const a = [3, 3, 5, 7, 7, 7, 9];
    const b = [5, 8, 8, 10, 11];
    const ref = referenceExactPValues(a, b);
    expect(analyze(input(a, b), config({ method: "exact" })).pValue).toBeCloseTo(ref.twoSided, 12);
    expect(analyze(input(a, b), config({ method: "exact", alternative: "less" })).pValue).toBeCloseTo(ref.less, 12);
    expect(analyze(input(a, b), config({ method: "exact", alternative: "greater" })).pValue).toBeCloseTo(ref.greater, 12);
  });
});

describe("analyze — edge cases", () => {
  it("zero variance: asymptotic is not computable and no decision is made", () => {
    const r = analyze(input([4, 4, 4], [4, 4]));
    expect(r.decision).toBe("not-computable");
    expect(r.pValue).toBeNull();
    expect(r.effectSizes.r).toBeNull();
    expect(r.notices.some((n) => /variance of U is zero/.test(n.message))).toBe(true);
  });

  it("zero variance: exact gives p = 1 and fails to reject", () => {
    const r = analyze(input([4, 4, 4], [4, 4]), config({ method: "exact" }));
    expect(r.pValue).toBe(1);
    expect(r.decision).toBe("fail-to-reject");
  });

  it("small samples get a normal-approximation warning", () => {
    const r = analyze(input([1, 2, 3], [4, 5, 6]));
    expect(r.notices.some((n) => /fewer than 10/.test(n.message))).toBe(true);
  });

  it("small samples where no critical value exists show the required message", () => {
    const r = analyze(input([1, 2, 3], [4, 5, 6]));
    expect(r.criticalValue).toEqual({
      available: false,
      message: "Critical value unavailable for this configuration. Use the p-value decision.",
    });
  });

  it("handles decimals and negative values", () => {
    const r = analyze(input([-3.2, -1.5, 0, 2.25], [1.1, 4.5, 6.75, 8, -0.5]));
    expect(r.u.R1 + r.u.R2).toBe(45);
    expect(r.u.U1 + r.u.U2).toBe(20);
  });

  it("falls back to default names when names are blank", () => {
    const r = analyze({ groupA: { name: "  ", values: [1, 2] }, groupB: { name: "", values: [3, 4] } });
    expect(r.input.groupA.name).toBe("Group A");
    expect(r.input.groupB.name).toBe("Group B");
  });

  it.each([
    ["empty group", input([], [1, 2])],
    ["NaN", input([1, Number.NaN], [2, 3])],
    ["Infinity", input([1, 2], [Number.POSITIVE_INFINITY])],
  ])("rejects invalid input: %s", (_, bad) => {
    expect(() => analyze(bad)).toThrow();
  });

  it.each([0, 1, -0.1, Number.NaN])("rejects invalid alpha %f", (alpha) => {
    expect(() => analyze(SAMPLE_INPUT, config({ alpha }))).toThrow();
  });
});
