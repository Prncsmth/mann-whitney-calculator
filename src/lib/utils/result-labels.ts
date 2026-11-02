import type { Alternative, MannWhitneyResult, UsedMethod } from "@/types/statistics";

/** Short name of the method that produced a p-value. */
export function methodName(method: UsedMethod): string {
  return method === "exact" ? "Exact permutation" : "Normal approximation";
}

/** Full description of how the headline p-value was obtained. */
export function methodDescription(result: MannWhitneyResult): string {
  if (result.methodUsed === "exact") {
    return result.ranking.hasTies ? "Exact permutation (tie-aware)" : "Exact permutation";
  }
  if (result.methodUsed === "asymptotic") {
    const parts = ["tie-corrected variance"];
    parts.push(result.config.continuityCorrection ? "continuity correction" : "no continuity correction");
    if (!result.ranking.hasTies) parts.shift();
    return `Normal approximation (${parts.join(", ")})`;
  }
  return "Not computable";
}

export function alternativeLabel(alternative: Alternative): string {
  if (alternative === "greater") return "One-sided: Group A greater than Group B";
  if (alternative === "less") return "One-sided: Group A less than Group B";
  return "Two-sided";
}

export function decisionLabel(result: MannWhitneyResult): string {
  return result.interpretation.decisionStatement;
}
