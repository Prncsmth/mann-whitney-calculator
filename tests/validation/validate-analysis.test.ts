import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CONFIG } from "@/lib/statistics/mann-whitney";
import {
  runValidatedAnalysis,
  validateAnalysisForm,
  type AnalysisFormValues,
} from "@/lib/validation/validate-analysis";
import { MAX_OBSERVATIONS_PER_GROUP } from "@/lib/validation/parse-observations";
import { alphaSchema } from "@/lib/validation/schemas";
import type { AnalysisConfig } from "@/types/statistics";

function form(
  a: string,
  b: string,
  overrides: { config?: Partial<AnalysisConfig>; nameA?: string; nameB?: string; descA?: string } = {},
): AnalysisFormValues {
  return {
    groupA: { name: overrides.nameA ?? "Traditional Lecture", description: overrides.descA ?? "", rawValues: a },
    groupB: { name: overrides.nameB ?? "Gamified Learning", description: "", rawValues: b },
    config: { ...DEFAULT_CONFIG, ...overrides.config },
  };
}

const SAMPLE_A = "12, 15, 11, 14, 10, 13, 16, 9, 12, 14";
const SAMPLE_B = "18\n16\n20\n15\n19\n17\n21\n14\n18\n17";

describe("validateAnalysisForm", () => {
  it("accepts the classroom sample (mixed separators across groups)", () => {
    const v = validateAnalysisForm(form(SAMPLE_A, SAMPLE_B));
    expect(v.success).toBe(true);
    if (v.success) {
      expect(v.input.groupA.values).toHaveLength(10);
      expect(v.input.groupB.values).toEqual([18, 16, 20, 15, 19, 17, 21, 14, 18, 17]);
      expect(v.input.groupA.description).toBeUndefined();
    }
  });

  it("rejects an empty group with a helpful message", () => {
    const v = validateAnalysisForm(form(SAMPLE_A, "  \n , "));
    expect(v.success).toBe(false);
    expect(v.groupB.fieldErrors.values).toBe("Enter at least one numeric observation.");
    expect(v.groupA.fieldErrors.values).toBeUndefined();
  });

  it("rejects when both groups are empty", () => {
    const v = validateAnalysisForm(form("", ""));
    expect(v.success).toBe(false);
    expect(v.groupA.fieldErrors.values).toBeDefined();
    expect(v.groupB.fieldErrors.values).toBeDefined();
  });

  it("blocks calculation when any entry is invalid, even if valid numbers remain", () => {
    const v = validateAnalysisForm(form("12, 15, abc, NaN", SAMPLE_B));
    expect(v.success).toBe(false);
    expect(v.groupA.values).toEqual([12, 15]); // live count still shown
    expect(v.groupA.entryErrors.map((e) => e.token)).toEqual(["abc", "NaN"]);
    expect(v.groupA.fieldErrors.values).toBe("2 entries are not valid. Fix them before calculating.");
  });

  it("uses singular wording for one invalid entry", () => {
    const v = validateAnalysisForm(form("12, Infinity", SAMPLE_B));
    expect(v.groupA.fieldErrors.values).toBe("1 entry is not valid. Fix it before calculating.");
  });

  it("an entirely invalid group reports the bad entries", () => {
    const v = validateAnalysisForm(form("abc, def", SAMPLE_B));
    expect(v.success).toBe(false);
    expect(v.groupA.entryErrors).toHaveLength(2);
    expect(v.groupA.fieldErrors.values).toBeDefined();
  });

  it("accepts decimals, negatives and duplicates", () => {
    const v = validateAnalysisForm(form("-1.5, 0, 0, 2.25", "-1.5\n3.75\n3.75"));
    expect(v.success).toBe(true);
  });

  it("fills in default names when names are blank", () => {
    const v = validateAnalysisForm(form("1, 2", "3, 4", { nameA: "  ", nameB: "" }));
    expect(v.success).toBe(true);
    if (v.success) {
      expect(v.input.groupA.name).toBe("Group A");
      expect(v.input.groupB.name).toBe("Group B");
    }
  });

  it("trims names and descriptions", () => {
    const v = validateAnalysisForm(form("1, 2", "3, 4", { nameA: "  Lecture  ", descA: "  Morning class  " }));
    expect(v.success && [v.input.groupA.name, v.input.groupA.description]).toEqual(["Lecture", "Morning class"]);
  });

  it("requires different group names (case-insensitive)", () => {
    const v = validateAnalysisForm(form("1, 2", "3, 4", { nameA: "Class", nameB: "class" }));
    expect(v.success).toBe(false);
    expect(v.groupB.fieldErrors.name).toBe("The two groups need different names.");
  });

  it("rejects overly long names and descriptions", () => {
    const v = validateAnalysisForm(form("1, 2", "3, 4", { nameA: "x".repeat(61), descA: "y".repeat(201) }));
    expect(v.success).toBe(false);
    expect(v.groupA.fieldErrors.name).toMatch(/60 characters/);
    expect(v.groupA.fieldErrors.description).toMatch(/200 characters/);
  });

  it("rejects too many observations", () => {
    const many = Array.from({ length: MAX_OBSERVATIONS_PER_GROUP + 1 }, (_, i) => i).join(",");
    const v = validateAnalysisForm(form(many, "1, 2"));
    expect(v.success).toBe(false);
    expect(v.groupA.fieldErrors.values).toMatch(/at most 10,000/);
  });

  it.each([
    [0, /greater than 0/],
    [-0.05, /greater than 0/],
    [0.6, /0.5 or less/],
    [1, /0.5 or less/],
    [Number.NaN, /must be a number/],
  ])("rejects invalid alpha %f", (alpha, message) => {
    const v = validateAnalysisForm(form(SAMPLE_A, SAMPLE_B, { config: { alpha } }));
    expect(v.success).toBe(false);
    if (!v.success) expect(v.configErrors.alpha).toMatch(message);
  });

  it.each([0.1, 0.05, 0.01, 0.025, 0.001])("accepts alpha %f", (alpha) => {
    expect(alphaSchema.safeParse(alpha).success).toBe(true);
  });

  it("rejects an unknown alternative or method", () => {
    const bad = form(SAMPLE_A, SAMPLE_B);
    (bad.config as unknown as Record<string, unknown>).alternative = "bigger";
    (bad.config as unknown as Record<string, unknown>).method = "bootstrap";
    const v = validateAnalysisForm(bad);
    expect(v.success).toBe(false);
    if (!v.success) {
      expect(v.configErrors.alternative).toBeDefined();
      expect(v.configErrors.method).toBeDefined();
    }
  });
});

describe("runValidatedAnalysis", () => {
  it("runs the engine for valid input and returns the approved sample results", () => {
    const r = runValidatedAnalysis(form(SAMPLE_A, SAMPLE_B));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.result.u).toMatchObject({ R1: 60, R2: 150, U1: 5, U2: 95, U: 5 });
      expect(r.result.pValue).toBeCloseTo(7.3729e-4, 7);
      expect(r.result.input.groupA.name).toBe("Traditional Lecture");
    }
  });

  it.each([
    ["empty group", form(SAMPLE_A, "")],
    ["invalid entry", form("12, 1x", SAMPLE_B)],
    ["Infinity", form("12, Infinity", SAMPLE_B)],
    ["invalid alpha", form(SAMPLE_A, SAMPLE_B, { config: { alpha: 2 } })],
  ])("never calls the statistical engine when input is invalid: %s", (_, bad) => {
    const engine = vi.fn();
    const r = runValidatedAnalysis(bad, engine);
    expect(r.ok).toBe(false);
    expect(engine).not.toHaveBeenCalled();
  });
});
