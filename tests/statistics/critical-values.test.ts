import { describe, expect, it } from "vitest";
import {
  CRITICAL_VALUE_UNAVAILABLE,
  conventionalCriticalValue,
} from "@/lib/statistics/critical-values";

describe("conventional (no-ties) critical values", () => {
  // Published Mann–Whitney U tables, smaller U, reject if U ≤ value.
  it.each([
    [5, 5, 2],
    [6, 6, 5],
    [7, 7, 8],
    [8, 8, 13],
    [9, 9, 17],
    [10, 10, 23],
    [20, 20, 127],
    [5, 10, 8],
  ])("two-sided α = 0.05, n1 = %i, n2 = %i → %i", (n1, n2, expected) => {
    const cv = conventionalCriticalValue(n1, n2, 0.05, "two-sided");
    expect(cv.available).toBe(true);
    if (cv.available) {
      expect(cv.value).toBe(expected);
      expect(cv.statistic).toBe("U");
      expect(cv.attainedAlpha).toBeLessThanOrEqual(0.05);
      expect(cv.rule).toBe(`Reject H₀ if U ≤ ${expected}`);
    }
  });

  it("two-sided α = 0.01, n1 = n2 = 10 → 16", () => {
    const cv = conventionalCriticalValue(10, 10, 0.01, "two-sided");
    expect(cv.available && cv.value).toBe(16);
  });

  it("one-sided α = 0.05, n1 = n2 = 10 → 27 (for U1 or U2 depending on direction)", () => {
    const less = conventionalCriticalValue(10, 10, 0.05, "less");
    const greater = conventionalCriticalValue(10, 10, 0.05, "greater");
    expect(less.available && [less.statistic, less.value]).toEqual(["U1", 27]);
    expect(greater.available && [greater.statistic, greater.value]).toEqual(["U2", 27]);
  });

  it("is unavailable when no outcome is extreme enough (n1 = n2 = 3, two-sided)", () => {
    const cv = conventionalCriticalValue(3, 3, 0.05, "two-sided");
    expect(cv).toEqual({ available: false, message: CRITICAL_VALUE_UNAVAILABLE });
  });
});
