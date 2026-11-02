import { describe, expect, it } from "vitest";
import { displayNumber, typographicMinus, withMinus } from "@/lib/utils/format";

describe("typographicMinus (display only)", () => {
  it("replaces the hyphen in negative numbers inside sentences", () => {
    expect(typographicMinus("rank-biserial correlation = -0.90).")).toBe("rank-biserial correlation = −0.90).");
    expect(typographicMinus("z = -3.4132, r = -0.76")).toBe("z = −3.4132, r = −0.76");
    expect(typographicMinus("(-2.5)")).toBe("(−2.5)");
    expect(typographicMinus("-1 at the start")).toBe("−1 at the start");
    expect(typographicMinus("value -.5")).toBe("value −.5");
  });

  it("leaves hyphens inside words and between digits unchanged", () => {
    const text = "rank-biserial p-value two-sided Mann–Whitney Group 2-3 non-parametric";
    expect(typographicMinus(text)).toBe(text);
  });

  it("does not change text without negative numbers", () => {
    expect(typographicMinus("p = 0.00074 ≤ α = 0.05")).toBe("p = 0.00074 ≤ α = 0.05");
  });

  it("matches the minus sign used for formatted numbers", () => {
    expect(withMinus("-3.3753")).toBe("−3.3753");
    expect(displayNumber(-0.9)).toBe("−0.9");
    expect(typographicMinus("= -0.9")).toBe(`= ${displayNumber(-0.9)}`);
  });
});
