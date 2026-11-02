import { describe, expect, it } from "vitest";
import { erfc, normalCdf, normalSf } from "@/lib/statistics/normal-distribution";

/** Relative closeness, needed for very small tail probabilities. */
function expectRelClose(actual: number, expected: number, rel = 1e-12) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(Math.abs(expected) * rel);
}

describe("normal distribution", () => {
  // Reference values from standard tables (Abramowitz & Stegun / high-precision software).
  it.each([
    [0, 1],
    [0.5, 0.4795001221869535],
    [1, 0.15729920705028513],
    [2, 0.004677734981047266],
    [3, 2.209049699858544e-5],
    [5, 1.5374597944280349e-12],
    [10, 2.088487583762545e-45],
  ])("erfc(%f) = %e", (x, expected) => {
    expectRelClose(erfc(x), expected);
  });

  it("is consistent for negative arguments", () => {
    expectRelClose(erfc(-1), 2 - 0.15729920705028513);
  });

  it("matches standard normal table values", () => {
    expectRelClose(normalCdf(1.96), 0.9750021048517795);
    expectRelClose(normalSf(1.96), 0.024997895148220435, 1e-10);
    expectRelClose(normalSf(3), 0.0013498980316301035, 1e-10);
    expectRelClose(normalSf(5), 2.866515718791939e-7, 1e-10);
    expect(normalCdf(0)).toBe(0.5);
  });

  it("is continuous at the series / continued-fraction switch point", () => {
    const x = 2.5;
    expectRelClose(erfc(x - 1e-12), erfc(x + 1e-12), 1e-9);
  });
});
