/**
 * Shared types for the Mann–Whitney U statistical engine.
 *
 * Group A is always "Group 1" (n1, R1, U1) and Group B is always "Group 2"
 * (n2, R2, U2). The engine never swaps these labels.
 */

export type GroupId = "A" | "B";

/** Direction of the alternative hypothesis, always stated for Group A vs Group B. */
export type Alternative = "two-sided" | "greater" | "less";

/** Method requested by the user. */
export type PValueMethod = "asymptotic" | "exact" | "automatic";

/** Method that actually produced the reported p-value. */
export type UsedMethod = "asymptotic" | "exact";

export interface GroupInput {
  name: string;
  description?: string;
  values: number[];
}

export interface AnalysisInput {
  groupA: GroupInput;
  groupB: GroupInput;
}

export interface AnalysisConfig {
  alpha: number;
  alternative: Alternative;
  method: PValueMethod;
  /** Continuity correction for the asymptotic (normal) approximation. */
  continuityCorrection: boolean;
}

export interface RankedObservation {
  /** Label such as "A1" or "B7" (1-based position within its own group). */
  id: string;
  group: GroupId;
  /** Index within the group's original input order (0-based). */
  indexInGroup: number;
  value: number;
  /** 1-based position in the ascending sort of the pooled data. */
  sortedPosition: number;
  /** Average rank (may end in .5 when tied). */
  rank: number;
  /** Twice the rank. Always an integer, used internally for exact arithmetic. */
  doubledRank: number;
  /** True when this value occurs more than once in the pooled data. */
  tied: boolean;
}

export interface TieGroup {
  value: number;
  /** Number of observations sharing this value (t). */
  count: number;
  /** First and last 1-based sorted positions occupied by the tie. */
  firstPosition: number;
  lastPosition: number;
  /** Average of the occupied positions. */
  rank: number;
}

export interface RankingResult {
  /** All observations, in ascending order of value (ties keep input order: A before B). */
  sorted: RankedObservation[];
  /** Observations of Group A in original input order. */
  groupA: RankedObservation[];
  /** Observations of Group B in original input order. */
  groupB: RankedObservation[];
  /** Only values that occur more than once. */
  tieGroups: TieGroup[];
  /** Σ (t³ − t) over all tie groups. 0 when there are no ties. */
  tieCorrectionTerm: number;
  hasTies: boolean;
}

export interface UStatistics {
  n1: number;
  n2: number;
  N: number;
  R1: number;
  R2: number;
  /** Expected total N(N + 1)/2, for the R1 + R2 check. */
  expectedRankTotal: number;
  /** U for Group A: R1 − n1(n1 + 1)/2. */
  U1: number;
  /** U for Group B: R2 − n2(n2 + 1)/2. */
  U2: number;
  /** min(U1, U2). */
  U: number;
  meanRankA: number;
  meanRankB: number;
}

export interface ExactDistribution {
  /** Possible values of 2·U1 under H0, ascending. */
  doubledU1: number[];
  /** Probability of each value in doubledU1. Sums to 1. */
  probabilities: number[];
  /** Number of equally likely group assignments, C(N, n1). */
  totalAssignments: number;
}

export interface PValues {
  /** P-value for the alternative "Group A less than Group B". */
  less: number;
  /** P-value for the alternative "Group A greater than Group B". */
  greater: number;
  /** Two-sided p-value. */
  twoSided: number;
}

export interface ExactTestResult {
  feasible: true;
  distribution: ExactDistribution;
  pValues: PValues;
}

export interface ExactTestInfeasible {
  feasible: false;
  reason: string;
  estimatedWork: number;
  workLimit: number;
}

export interface AsymptoticTestResult {
  computable: true;
  /** E[U] = n1·n2 / 2 */
  mean: number;
  /** Tie-corrected Var[U]. */
  variance: number;
  /** Var[U] without the tie correction, for display. */
  varianceWithoutTieCorrection: number;
  standardDeviation: number;
  /** z = (U1 − E[U]) / σ, without continuity correction. Used for effect size r. */
  zUncorrected: number;
  /** z used for the p-value of the selected alternative. */
  z: number;
  continuityCorrection: boolean;
  /** The ±0.5 actually applied to U1 − E[U] for the selected alternative. */
  correctionApplied: number;
  pValue: number;
  /** Warnings about whether the normal approximation is suitable. */
  warnings: string[];
}

export interface AsymptoticTestNotComputable {
  computable: false;
  reason: string;
}

export type CriticalStatistic = "U" | "U1" | "U2";

export interface CriticalValue {
  available: true;
  /** Which statistic is compared against the critical value. */
  statistic: CriticalStatistic;
  value: number;
  /** Actual probability P(statistic ≤ value) under H0 (≤ α). */
  attainedAlpha: number;
  /** Plain-language rejection rule, e.g. "Reject H₀ if U ≤ 23". */
  rule: string;
}

export interface CriticalValueUnavailable {
  available: false;
  message: string;
}

export type CriticalValueResult = CriticalValue | CriticalValueUnavailable;

export type MagnitudeLabel = "negligible" | "small" | "medium" | "large";

export interface EffectSizes {
  /**
   * Rank-biserial correlation (U1 − U2)/(n1·n2).
   * Positive: Group A tends to have higher values. Negative: Group B tends higher.
   */
  rankBiserial: number;
  rankBiserialMagnitude: MagnitudeLabel;
  /**
   * r = z / √N using the uncorrected z. Same sign convention as rank-biserial.
   * null when the variance is zero.
   */
  r: number | null;
  rMagnitude: MagnitudeLabel | null;
}

export type Decision = "reject" | "fail-to-reject" | "not-computable";

export interface Descriptives {
  n: number;
  median: number;
  min: number;
  max: number;
  meanRank: number;
}

export interface Interpretation {
  nullHypothesis: string;
  alternativeHypothesis: string;
  decisionStatement: string;
  decisionExplanation: string;
  directionStatement: string;
  effectSizeStatement: string;
  conclusion: string;
}

export interface MethodNotice {
  level: "info" | "warning";
  message: string;
}

export interface MannWhitneyResult {
  input: AnalysisInput;
  config: AnalysisConfig;
  ranking: RankingResult;
  u: UStatistics;
  descriptives: { A: Descriptives; B: Descriptives };
  exact: ExactTestResult | ExactTestInfeasible;
  asymptotic: AsymptoticTestResult | AsymptoticTestNotComputable;
  /** Method that produced pValue. null only when no p-value could be computed. */
  methodUsed: UsedMethod | null;
  /** The headline p-value for the selected alternative, or null if not computable. */
  pValue: number | null;
  /** P-value from the other method, when available. */
  secondaryPValue: { method: UsedMethod; value: number } | null;
  /** Critical value from the exact distribution of THIS dataset (tie-aware). */
  criticalValue: CriticalValueResult;
  /** Conventional table value assuming no ties. Reference only. */
  conventionalCriticalValue: CriticalValueResult;
  effectSizes: EffectSizes;
  decision: Decision;
  interpretation: Interpretation;
  notices: MethodNotice[];
}
