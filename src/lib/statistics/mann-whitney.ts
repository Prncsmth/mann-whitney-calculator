import type {
  Alternative,
  AnalysisConfig,
  AnalysisInput,
  Decision,
  Descriptives,
  MannWhitneyResult,
  MethodNotice,
  PValues,
  RankedObservation,
  UsedMethod,
} from "@/types/statistics";
import { rankObservations } from "./ranking";
import { computeUStatistics } from "./u-statistic";
import { runExactTest, EXACT_WORK_LIMIT } from "./exact-test";
import { runAsymptoticTest } from "./asymptotic-test";
import { conventionalCriticalValue, exactCriticalValue } from "./critical-values";
import { computeEffectSizes } from "./effect-size";
import { buildInterpretation } from "./interpretation";

export const DEFAULT_CONFIG: AnalysisConfig = {
  alpha: 0.05,
  alternative: "two-sided",
  method: "asymptotic",
  continuityCorrection: true,
};

const P_KEY: Record<Alternative, keyof PValues> = {
  "two-sided": "twoSided",
  greater: "greater",
  less: "less",
};

function median(values: readonly number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function describe(values: readonly number[], ranked: readonly RankedObservation[]): Descriptives {
  return {
    n: values.length,
    median: median(values),
    min: Math.min(...values),
    max: Math.max(...values),
    meanRank: ranked.reduce((s, o) => s + o.rank, 0) / ranked.length,
  };
}

function assertValidInput(input: AnalysisInput, config: AnalysisConfig) {
  for (const [label, g] of [["Group A", input.groupA], ["Group B", input.groupB]] as const) {
    if (g.values.length === 0) throw new Error(`${label} has no observations.`);
    if (!g.values.every(Number.isFinite)) throw new Error(`${label} contains a value that is not a finite number.`);
  }
  if (!(config.alpha > 0 && config.alpha < 1)) throw new Error("Alpha must be between 0 and 1.");
}

/**
 * Runs the complete Mann–Whitney U test.
 * Pure function: no UI, no storage, no network.
 */
export function analyze(
  input: AnalysisInput,
  config: AnalysisConfig = DEFAULT_CONFIG,
  options: { exactWorkLimit?: number } = {},
): MannWhitneyResult {
  assertValidInput(input, config);
  const workLimit = options.exactWorkLimit ?? EXACT_WORK_LIMIT;
  const nameA = input.groupA.name.trim() || "Group A";
  const nameB = input.groupB.name.trim() || "Group B";

  const ranking = rankObservations(input.groupA.values, input.groupB.values);
  const u = computeUStatistics(ranking);
  const { n1, n2, U1, U2 } = u;

  const pooledDoubledRanks = [...ranking.groupA, ...ranking.groupB].map((o) => o.doubledRank);
  const exact = runExactTest(pooledDoubledRanks, n1, U1, workLimit);
  const asymptotic = runAsymptoticTest({
    U1,
    n1,
    n2,
    tieCorrectionTerm: ranking.tieCorrectionTerm,
    alternative: config.alternative,
    continuityCorrection: config.continuityCorrection,
  });

  const notices: MethodNotice[] = [];
  const exactP = exact.feasible ? exact.pValues[P_KEY[config.alternative]] : null;
  const asymptoticP = asymptotic.computable ? asymptotic.pValue : null;

  let methodUsed: UsedMethod | null = null;
  if (config.method === "asymptotic") {
    if (asymptoticP !== null) methodUsed = "asymptotic";
    else if (!asymptotic.computable)
      notices.push({ level: "warning", message: `${asymptotic.reason} Select the exact method instead.` });
  } else if (config.method === "exact") {
    if (exactP !== null) methodUsed = "exact";
    else if (asymptoticP !== null) {
      methodUsed = "asymptotic";
      notices.push({
        level: "warning",
        message:
          "The exact method was requested, but the exact distribution is too large to compute in the browser for these sample sizes. The normal approximation was used instead.",
      });
    }
  } else {
    if (exactP !== null) {
      methodUsed = "exact";
      notices.push({ level: "info", message: "Automatic: the exact permutation method was used because it is feasible for these sample sizes." });
    } else if (asymptoticP !== null) {
      methodUsed = "asymptotic";
      notices.push({ level: "info", message: "Automatic: the normal approximation was used because the exact distribution is too large to compute for these sample sizes." });
    }
  }

  if (methodUsed === "asymptotic" && asymptotic.computable) {
    asymptotic.warnings.forEach((message) => notices.push({ level: "warning", message }));
  }

  const pValue = methodUsed === "exact" ? exactP : methodUsed === "asymptotic" ? asymptoticP : null;
  let secondaryPValue: MannWhitneyResult["secondaryPValue"] = null;
  if (methodUsed === "asymptotic" && exactP !== null) secondaryPValue = { method: "exact", value: exactP };
  if (methodUsed === "exact" && asymptoticP !== null) secondaryPValue = { method: "asymptotic", value: asymptoticP };

  const decision: Decision = pValue === null ? "not-computable" : pValue <= config.alpha ? "reject" : "fail-to-reject";

  const criticalValue = exactCriticalValue(
    exact.feasible ? exact.distribution : null,
    n1,
    n2,
    config.alpha,
    config.alternative,
  );
  const conventional = conventionalCriticalValue(n1, n2, config.alpha, config.alternative);

  if (ranking.hasTies) {
    notices.push({
      level: "warning",
      message:
        "This dataset contains tied values. Conventional critical-value tables assume no ties, so the conventional value is shown for reference only. The tie-corrected p-value is used for the decision.",
    });
  }
  if (criticalValue.available && methodUsed === "asymptotic" && decision !== "not-computable") {
    const statValue = criticalValue.statistic === "U1" ? U1 : criticalValue.statistic === "U2" ? U2 : u.U;
    const criticalSaysReject = statValue <= criticalValue.value;
    if (criticalSaysReject !== (decision === "reject")) {
      notices.push({
        level: "warning",
        message:
          "The exact critical value and the normal-approximation p-value lead to different decisions for this data. The decision shown follows the p-value of the selected method; consider the exact method.",
      });
    }
  }

  const effectSizes = computeEffectSizes({
    U1,
    U2,
    n1,
    n2,
    zUncorrected: asymptotic.computable ? asymptotic.zUncorrected : null,
  });

  const interpretation = buildInterpretation({
    nameA,
    nameB,
    alternative: config.alternative,
    alpha: config.alpha,
    pValue,
    methodUsed,
    decision,
    u,
    effectSizes,
  });

  return {
    input: { groupA: { ...input.groupA, name: nameA }, groupB: { ...input.groupB, name: nameB } },
    config,
    ranking,
    u,
    descriptives: { A: describe(input.groupA.values, ranking.groupA), B: describe(input.groupB.values, ranking.groupB) },
    exact,
    asymptotic,
    methodUsed,
    pValue,
    secondaryPValue,
    criticalValue,
    conventionalCriticalValue: conventional,
    effectSizes,
    decision,
    interpretation,
    notices,
  };
}
