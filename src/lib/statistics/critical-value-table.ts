import type { Alternative } from "@/types/statistics";
import { conventionalCriticalValue } from "./critical-values";

export const TABLE_MIN_N = 2;
export const TABLE_MAX_N = 20;

export interface CriticalValueTableSpec {
  id: string;
  label: string;
  alpha: number;
  tails: "two" | "one";
}

export const TABLE_SPECS: CriticalValueTableSpec[] = [
  { id: "two-05", label: "Two-tailed, α = 0.05", alpha: 0.05, tails: "two" },
  { id: "two-01", label: "Two-tailed, α = 0.01", alpha: 0.01, tails: "two" },
  { id: "one-05", label: "One-tailed, α = 0.05", alpha: 0.05, tails: "one" },
  { id: "one-01", label: "One-tailed, α = 0.01", alpha: 0.01, tails: "one" },
];

export interface CriticalValueTable extends CriticalValueTableSpec {
  /** Sample sizes shown on both axes (2 … 20). */
  sizes: number[];
  /** values[i][j] = critical U for n₁ = sizes[i], n₂ = sizes[j]; null when no value exists. */
  values: (number | null)[][];
}

/**
 * Conventional Mann–Whitney critical values (no ties), computed from the exact
 * null distribution — not typed in from a book. Reject H₀ if U ≤ the value.
 * For one-tailed tests the smaller-tail statistic is used, so the value is the
 * same whichever direction H₁ states.
 */
export function buildCriticalValueTable(spec: CriticalValueTableSpec): CriticalValueTable {
  const sizes = Array.from({ length: TABLE_MAX_N - TABLE_MIN_N + 1 }, (_, i) => TABLE_MIN_N + i);
  const alternative: Alternative = spec.tails === "two" ? "two-sided" : "less";
  const cache = new Map<string, number | null>();
  const values = sizes.map((n1) =>
    sizes.map((n2) => {
      const key = `${Math.min(n1, n2)}-${Math.max(n1, n2)}`; // the table is symmetric
      if (!cache.has(key)) {
        const cv = conventionalCriticalValue(n1, n2, spec.alpha, alternative);
        cache.set(key, cv.available ? cv.value : null);
      }
      return cache.get(key)!;
    }),
  );
  return { ...spec, sizes, values };
}

export function buildAllCriticalValueTables(): CriticalValueTable[] {
  return TABLE_SPECS.map(buildCriticalValueTable);
}
