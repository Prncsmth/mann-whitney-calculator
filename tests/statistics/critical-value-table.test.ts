import { describe, expect, it } from "vitest";
import { buildAllCriticalValueTables, buildCriticalValueTable, TABLE_SPECS } from "@/lib/statistics/critical-value-table";

const table = (id: string) => buildCriticalValueTable(TABLE_SPECS.find((s) => s.id === id)!);
const at = (t: ReturnType<typeof table>, n1: number, n2: number) => t.values[t.sizes.indexOf(n1)][t.sizes.indexOf(n2)];

describe("critical value table", () => {
  it("covers sample sizes 2 to 20 in four tables", () => {
    const all = buildAllCriticalValueTables();
    expect(all.map((t) => t.id)).toEqual(["two-05", "two-01", "one-05", "one-01"]);
    for (const t of all) {
      expect(t.sizes[0]).toBe(2);
      expect(t.sizes[t.sizes.length - 1]).toBe(20);
      expect(t.values).toHaveLength(19);
      expect(t.values.every((r) => r.length === 19)).toBe(true);
    }
  });

  // Values from published Mann–Whitney U tables.
  it.each([
    [5, 5, 2],
    [6, 6, 5],
    [7, 7, 8],
    [8, 8, 13],
    [9, 9, 17],
    [10, 10, 23],
    [20, 20, 127],
    [5, 10, 8],
  ])("two-tailed α = 0.05: n₁ = %i, n₂ = %i → %i", (n1, n2, expected) => {
    expect(at(table("two-05"), n1, n2)).toBe(expected);
  });

  it("matches other published values", () => {
    expect(at(table("two-01"), 10, 10)).toBe(16);
    expect(at(table("one-05"), 10, 10)).toBe(27);
  });

  it("shows no value where none exists (very small samples)", () => {
    expect(at(table("two-05"), 2, 2)).toBeNull();
    expect(at(table("two-05"), 3, 3)).toBeNull();
  });

  it("is symmetric: swapping n₁ and n₂ gives the same value", () => {
    for (const t of buildAllCriticalValueTables()) {
      t.values.forEach((row, i) => row.forEach((v, j) => expect(v).toBe(t.values[j][i])));
    }
  });

  it("never decreases as the sample sizes grow", () => {
    const t = table("two-05");
    for (let i = 0; i < t.sizes.length; i++) {
      for (let j = 1; j < t.sizes.length; j++) {
        const a = t.values[i][j - 1];
        const b = t.values[i][j];
        if (a !== null && b !== null) expect(b).toBeGreaterThanOrEqual(a);
      }
    }
  });

  it("a stricter α (0.01) never gives a larger critical value than 0.05", () => {
    const t05 = table("two-05");
    const t01 = table("two-01");
    t01.values.forEach((row, i) =>
      row.forEach((v, j) => {
        if (v !== null) expect(v).toBeLessThanOrEqual(t05.values[i][j]!);
      }),
    );
  });
});
