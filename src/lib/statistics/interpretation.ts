import type {
  Alternative,
  Decision,
  EffectSizes,
  Interpretation,
  UsedMethod,
  UStatistics,
} from "@/types/statistics";
import { formatAlpha, formatFixed, formatNumber, formatPValue } from "@/lib/utils/format";

const METHOD_LABEL: Record<UsedMethod, string> = {
  asymptotic: "normal approximation",
  exact: "exact permutation",
};

export function hypotheses(nameA: string, nameB: string, alternative: Alternative) {
  if (alternative === "greater") {
    return {
      nullHypothesis: `The scores of ${nameA} do not tend to be higher than the scores of ${nameB}.`,
      alternativeHypothesis: `The scores of ${nameA} tend to be higher than the scores of ${nameB}.`,
    };
  }
  if (alternative === "less") {
    return {
      nullHypothesis: `The scores of ${nameA} do not tend to be lower than the scores of ${nameB}.`,
      alternativeHypothesis: `The scores of ${nameA} tend to be lower than the scores of ${nameB}.`,
    };
  }
  return {
    nullHypothesis: `There is no statistically significant difference between the scores of ${nameA} and ${nameB}.`,
    alternativeHypothesis: `There is a statistically significant difference between the scores of ${nameA} and ${nameB}.`,
  };
}

function claim(nameA: string, nameB: string, alternative: Alternative): string {
  if (alternative === "greater") return `that ${nameA} tends to have higher scores than ${nameB}`;
  if (alternative === "less") return `that ${nameA} tends to have lower scores than ${nameB}`;
  return `of a difference between ${nameA} and ${nameB}`;
}

export function buildInterpretation(params: {
  nameA: string;
  nameB: string;
  alternative: Alternative;
  alpha: number;
  pValue: number | null;
  methodUsed: UsedMethod | null;
  decision: Decision;
  u: UStatistics;
  effectSizes: EffectSizes;
}): Interpretation {
  const { nameA, nameB, alternative, alpha, pValue, methodUsed, decision, u, effectSizes } = params;
  const { nullHypothesis, alternativeHypothesis } = hypotheses(nameA, nameB, alternative);
  const a = formatAlpha(alpha);

  // Observed direction, based on mean ranks.
  let directionStatement: string;
  let higherGroup: string | null = null;
  if (u.meanRankA > u.meanRankB) higherGroup = nameA;
  else if (u.meanRankB > u.meanRankA) higherGroup = nameB;
  if (higherGroup) {
    const [hi, lo] = higherGroup === nameA ? [u.meanRankA, u.meanRankB] : [u.meanRankB, u.meanRankA];
    const lower = higherGroup === nameA ? nameB : nameA;
    directionStatement = `${higherGroup} has a higher mean rank (${formatFixed(hi, 2)}) than ${lower} (${formatFixed(lo, 2)}), so ${higherGroup} showed generally higher observed scores in this sample.`;
  } else {
    directionStatement = `Both groups have the same mean rank (${formatFixed(u.meanRankA, 2)}), so neither group showed generally higher observed scores in this sample.`;
  }

  const rb = effectSizes.rankBiserial;
  const rText =
    effectSizes.r === null
      ? "r = z/√N could not be calculated because the variance is zero."
      : `r = z/√N = ${formatFixed(effectSizes.r, 2)} (${effectSizes.rMagnitude}).`;
  const effectSizeStatement =
    `Rank-biserial correlation = ${formatFixed(rb, 2)} (${effectSizes.rankBiserialMagnitude}); ${rText} ` +
    `Positive values mean ${nameA} tends to score higher; negative values mean ${nameB} tends to score higher. ` +
    `Effect sizes describe the separation observed in this sample, not cause and effect.`;

  if (decision === "not-computable" || pValue === null || methodUsed === null) {
    return {
      nullHypothesis,
      alternativeHypothesis,
      decisionStatement: "No decision",
      decisionExplanation:
        "A p-value could not be calculated with the selected method for this data, so no statistical decision can be made. Try the exact method.",
      directionStatement,
      effectSizeStatement,
      conclusion: "No conclusion can be drawn because the test could not be calculated for this data.",
    };
  }

  const p = formatPValue(pValue);
  const stats = `U = ${formatNumber(u.U)}, p = ${p}, ${METHOD_LABEL[methodUsed]}`;

  if (decision === "reject") {
    const direction = higherGroup
      ? ` ${higherGroup} showed generally higher observed scores in this sample, with a ${effectSizes.rankBiserialMagnitude} effect size (rank-biserial correlation = ${formatFixed(rb, 2)}).`
      : "";
    return {
      nullHypothesis,
      alternativeHypothesis,
      decisionStatement: "Reject H₀",
      decisionExplanation: `Since p = ${p} ≤ α = ${a}, the null hypothesis is rejected.`,
      directionStatement,
      effectSizeStatement,
      conclusion:
        `At α = ${a}, the sample provides statistically significant evidence ${claim(nameA, nameB, alternative)} (${stats}).` +
        direction +
        ` This result describes the observed samples and does not by itself show that one group is better in general.`,
    };
  }

  return {
    nullHypothesis,
    alternativeHypothesis,
    decisionStatement: "Fail to reject H₀",
    decisionExplanation: `Since p = ${p} > α = ${a}, the null hypothesis is not rejected. This does not prove H₀ is true; the sample does not provide enough evidence against it.`,
    directionStatement,
    effectSizeStatement,
    conclusion:
      `At α = ${a}, the sample does not provide statistically significant evidence ${claim(nameA, nameB, alternative)} (${stats}).` +
      ` This does not show that the groups are the same; the difference observed in this sample may be due to chance.`,
  };
}
