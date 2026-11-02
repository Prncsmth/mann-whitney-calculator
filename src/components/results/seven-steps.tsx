import type { ReactNode } from "react";
import type { CriticalValueResult, MannWhitneyResult } from "@/types/statistics";
import { displayNumber, formatAlpha, formatFixed, formatPValue, typographicMinus, withMinus } from "@/lib/utils/format";
import { alternativeLabel, methodDescription } from "@/lib/utils/result-labels";
import { Card, Formula, GroupDot, Notice } from "@/components/ui/primitives";
import { RankingTable } from "./ranking-table";

const MAX_TERMS = 24;

/** "4.5 + 10.5 + 3 + …" for a rank-sum calculation; long lists are shortened. */
function sumTerms(ranks: number[]): string {
  const terms = ranks.map((r) => displayNumber(r));
  if (terms.length <= MAX_TERMS) return terms.join(" + ");
  return `${terms.slice(0, 10).join(" + ")} + … + ${terms.slice(-3).join(" + ")}`;
}

const fx = (v: number, d = 4) => withMinus(formatFixed(v, d));
const num = (v: number) => displayNumber(v);

function formatCount(n: number): string {
  return n < 1e15 ? Math.round(n).toLocaleString("en-US") : n.toExponential(3);
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <Card as="article" id={`step-${number}`} aria-labelledby={`step-${number}-title`} className="scroll-mt-24">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent font-mono text-sm font-semibold text-on-accent">
          {number}
        </span>
        <h3 id={`step-${number}-title`} className="text-lg font-semibold text-ink">
          <span className="sr-only">Step {number}: </span>
          {title}
        </h3>
      </div>
      <div className="space-y-4 px-5 py-5 text-[15px] leading-relaxed text-ink-soft">{children}</div>
    </Card>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return <h4 className="pt-2 text-sm font-semibold tracking-wide text-ink uppercase">{children}</h4>;
}

function criticalStatValue(result: MannWhitneyResult, cv: Extract<CriticalValueResult, { available: true }>) {
  return cv.statistic === "U1" ? result.u.U1 : cv.statistic === "U2" ? result.u.U2 : result.u.U;
}

const STAT_LABEL = { U: "U", U1: "U₁", U2: "U₂" } as const;

export function SevenSteps({ result }: { result: MannWhitneyResult }) {
  const { u, config, ranking, interpretation, asymptotic, exact, descriptives } = result;
  const nameA = result.input.groupA.name;
  const nameB = result.input.groupB.name;
  const alpha = formatAlpha(config.alpha);
  const alphaPercent = displayNumber(config.alpha * 100, 4);
  const p = result.pValue;

  const exactTail =
    config.alternative === "two-sided"
      ? `|U₁ − ${num(u.n1 * u.n2 / 2)}| ≥ |${num(u.U1)} − ${num(u.n1 * u.n2 / 2)}| = ${num(Math.abs(u.U1 - u.n1 * u.n2 / 2))}`
      : config.alternative === "greater"
        ? `U₁ ≥ ${num(u.U1)}`
        : `U₁ ≤ ${num(u.U1)}`;

  const asymptoticBlock = asymptotic.computable && (
    <div className="space-y-2">
      <Formula label="Mean of U">
        μ<sub>U</sub> = n₁n₂ / 2 = {u.n1} × {u.n2} / 2 = {num(asymptotic.mean)}
      </Formula>
      <Formula label={ranking.hasTies ? "Variance of U (with tie correction)" : "Variance of U"}>
        {ranking.hasTies ? (
          <>
            σ²<sub>U</sub> = (n₁n₂ / 12)·[(N + 1) − Σ(t³ − t) / (N(N − 1))] = ({u.n1 * u.n2} / 12)·[{u.N + 1} −{" "}
            {ranking.tieCorrectionTerm} / {u.N * (u.N - 1)}] = {fx(asymptotic.variance)}
          </>
        ) : (
          <>
            σ²<sub>U</sub> = n₁n₂(N + 1) / 12 = {u.n1 * u.n2} × {u.N + 1} / 12 = {fx(asymptotic.variance)}
          </>
        )}
      </Formula>
      <Formula label="Standard deviation">
        σ<sub>U</sub> = √{fx(asymptotic.variance)} = {fx(asymptotic.standardDeviation)}
      </Formula>
      <Formula
        label={
          asymptotic.correctionApplied !== 0
            ? "z statistic (with continuity correction of 0.5 toward the null)"
            : "z statistic"
        }
      >
        z = (U₁ − μ<sub>U</sub>
        {asymptotic.correctionApplied > 0 ? " − 0.5" : asymptotic.correctionApplied < 0 ? " + 0.5" : ""}) / σ<sub>U</sub>{" "}
        = ({num(u.U1)} − {num(asymptotic.mean)}
        {asymptotic.correctionApplied > 0 ? " − 0.5" : asymptotic.correctionApplied < 0 ? " + 0.5" : ""}) /{" "}
        {fx(asymptotic.standardDeviation)} = {fx(asymptotic.z)}
      </Formula>
      <Formula highlight label={`p-value (${alternativeLabel(config.alternative).toLowerCase()})`}>
        {config.alternative === "two-sided" && (
          <>p = 2 × P(Z ≥ |z|) = 2 × P(Z ≥ {fx(Math.abs(asymptotic.z))}) = {formatPValue(asymptotic.pValue)}</>
        )}
        {config.alternative === "greater" && (
          <>p = P(Z ≥ z) = P(Z ≥ {fx(asymptotic.z)}) = {formatPValue(asymptotic.pValue)}</>
        )}
        {config.alternative === "less" && (
          <>p = P(Z ≤ z) = P(Z ≤ {fx(asymptotic.z)}) = {formatPValue(asymptotic.pValue)}</>
        )}
      </Formula>
    </div>
  );

  const exactBlock = exact.feasible && (
    <div className="space-y-2">
      <p>
        Under H₀, every way of splitting the {u.N} ranks into groups of {u.n1} and {u.n2} is equally likely. There are
        C({u.N}, {u.n1}) = {formatCount(exact.distribution.totalAssignments)} such splits. The tied ranks are kept
        exactly as observed.
      </p>
      <Formula highlight label="Exact p-value">
        p = proportion of splits with {exactTail} = {formatPValue(exact.pValues[config.alternative === "two-sided" ? "twoSided" : config.alternative])}
      </Formula>
    </div>
  );

  const primaryIsExact = result.methodUsed === "exact";
  const cv = result.criticalValue;

  return (
    <section aria-labelledby="seven-steps-heading" className="space-y-5">
      <div>
        <h2 id="seven-steps-heading" className="text-xl font-semibold text-ink">
          Seven-step analysis
        </h2>
        <p className="mt-1 text-sm text-muted">The complete procedure, computed from the data above.</p>
      </div>

      <Step number={1} title="State the hypotheses">
        <Formula label="Null hypothesis (H₀)">
          <span className="font-sans">{interpretation.nullHypothesis}</span>
        </Formula>
        <Formula label="Alternative hypothesis (H₁)">
          <span className="font-sans">{interpretation.alternativeHypothesis}</span>
        </Formula>
        <p className="text-sm text-muted">Test direction: {alternativeLabel(config.alternative)}.</p>
      </Step>

      <Step number={2} title="Level of significance">
        <Formula>α = {alpha}</Formula>
        <p>
          We accept a {alphaPercent}% risk of rejecting H₀ when it is actually true (a Type I error). The p-value will be
          compared with this level.
        </p>
      </Step>

      <Step number={3} title="Given data">
        <div className="grid gap-4 md:grid-cols-2">
          {(["A", "B"] as const).map((g) => {
            const group = g === "A" ? result.input.groupA : result.input.groupB;
            return (
              <div key={g} className="rounded-md border border-line px-4 py-3">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <GroupDot group={g} />
                  Group {g}: {group.name}
                </p>
                {group.description && <p className="mt-0.5 text-sm text-muted">{group.description}</p>}
                <p className="mt-2 font-mono text-[15px] wrap-break-word text-ink">
                  {group.values.map((v) => displayNumber(v, 6)).join(", ")}
                </p>
                <p className="mt-2 font-mono text-sm text-ink-soft">
                  n{g === "A" ? "₁" : "₂"} = {group.values.length} · median = {displayNumber(descriptives[g].median)}
                </p>
              </div>
            );
          })}
        </div>
        <p className="font-mono text-sm text-ink-soft">N = n₁ + n₂ = {u.n1} + {u.n2} = {u.N}</p>
      </Step>

      <Step number={4} title="Statistical test used">
        <p>
          <strong className="text-ink">Mann–Whitney U test</strong> (also called the Wilcoxon rank-sum test). It is a
          nonparametric test for two independent samples: it does not assume the data are normally distributed, and it
          works with ordinal or continuous scores.
        </p>
        <p>
          The test replaces every score with its rank in the combined data and checks whether one group tends to have
          higher ranks than the other. It compares rank distributions, not means. When both groups have distributions of
          similar shape, a significant result can be read as a difference in location (for example, medians).
        </p>
        <p className="text-sm text-muted">
          Assumptions: the two samples are independent, observations within each group are independent, and the scores
          can be ordered.
        </p>
      </Step>

      <Step number={5} title="Compute the test statistic">
        <SubHeading>a. Combine, sort, and rank all scores</SubHeading>
        <p>
          All {u.N} scores are combined and sorted from lowest to highest. Ranks start at 1. Tied scores receive the
          average of the positions they occupy.
        </p>
        <RankingTable result={result} />
        {ranking.hasTies && (
          <div>
            <p className="mb-2 font-medium text-ink">Tied ranks</p>
            <ul className="grid gap-1.5 font-mono text-sm sm:grid-cols-2">
              {ranking.tieGroups.map((t) => {
                const positions = Array.from({ length: t.count }, (_, i) => t.firstPosition + i);
                return (
                  <li key={t.value} className="rounded-md bg-warn-soft px-3 py-1.5 text-ink">
                    Score {displayNumber(t.value, 6)} (×{t.count}): ({positions.join(" + ")}) / {t.count} ={" "}
                    {displayNumber(t.rank)}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <SubHeading>b. Rank sums</SubHeading>
        <div className="space-y-2">
          <Formula label={`R₁ — ranks of ${nameA}`}>
            R₁ = {sumTerms(ranking.groupA.map((o) => o.rank))} = {num(u.R1)}
          </Formula>
          <Formula label={`R₂ — ranks of ${nameB}`}>
            R₂ = {sumTerms(ranking.groupB.map((o) => o.rank))} = {num(u.R2)}
          </Formula>
          <Formula label="Check">
            R₁ + R₂ = {num(u.R1)} + {num(u.R2)} = {num(u.R1 + u.R2)} = N(N + 1) / 2 = {u.N} × {u.N + 1} / 2 ✓
          </Formula>
        </div>

        <SubHeading>c. U statistics</SubHeading>
        <div className="space-y-2">
          <Formula label="U for Group A">
            U₁ = R₁ − n₁(n₁ + 1) / 2 = {num(u.R1)} − {u.n1} × {u.n1 + 1} / 2 = {num(u.R1)} − {num((u.n1 * (u.n1 + 1)) / 2)} ={" "}
            {num(u.U1)}
          </Formula>
          <Formula label="U for Group B">
            U₂ = R₂ − n₂(n₂ + 1) / 2 = {num(u.R2)} − {u.n2} × {u.n2 + 1} / 2 = {num(u.R2)} − {num((u.n2 * (u.n2 + 1)) / 2)} ={" "}
            {num(u.U2)}
          </Formula>
          <Formula label="Check">
            U₁ + U₂ = {num(u.U1)} + {num(u.U2)} = {num(u.U1 + u.U2)} = n₁ × n₂ = {u.n1} × {u.n2} ✓
          </Formula>
          <Formula highlight label="Test statistic (smaller U)">
            U = min(U₁, U₂) = min({num(u.U1)}, {num(u.U2)}) = <strong>{num(u.U)}</strong>
          </Formula>
        </div>

        <SubHeading>d. P-value — {methodDescription(result)}</SubHeading>
        {result.methodUsed === null ? (
          <Notice level="warning">A p-value could not be calculated with the selected method for this data.</Notice>
        ) : primaryIsExact ? (
          exactBlock
        ) : (
          asymptoticBlock
        )}
        {result.secondaryPValue && (
          <details className="rounded-md border border-line px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-ink">
              For comparison: {primaryIsExact ? "normal approximation" : "exact permutation"} p ={" "}
              {formatPValue(result.secondaryPValue.value)}
            </summary>
            <div className="mt-3">{primaryIsExact ? asymptoticBlock : exactBlock}</div>
          </details>
        )}

        <SubHeading>e. Critical value</SubHeading>
        {cv.available ? (
          <Formula label={`From the exact null distribution of this data${ranking.hasTies ? " (tie-aware)" : ""}, α = ${alpha}`}>
            {cv.rule}
          </Formula>
        ) : (
          <Notice level="info">{cv.message}</Notice>
        )}
        {ranking.hasTies && result.conventionalCriticalValue.available && (
          <Notice level="warning">
            Conventional table value (assumes no ties): {result.conventionalCriticalValue.rule.replace("Reject H₀ if ", "")}. This
            dataset contains ties, so the table value is a reference only.
          </Notice>
        )}

        <SubHeading>f. Effect sizes</SubHeading>
        <div className="space-y-2">
          <Formula label="Rank-biserial correlation">
            r<sub>rb</sub> = (U₁ − U₂) / (n₁n₂) = ({num(u.U1)} − {num(u.U2)}) / {u.n1 * u.n2} ={" "}
            {fx(result.effectSizes.rankBiserial, 3)} ({result.effectSizes.rankBiserialMagnitude})
          </Formula>
          {result.effectSizes.r !== null && asymptotic.computable && (
            <Formula label="r from the uncorrected z">
              r = z / √N = {fx(asymptotic.zUncorrected)} / √{u.N} = {fx(result.effectSizes.r, 3)} (
              {result.effectSizes.rMagnitude})
            </Formula>
          )}
          <p className="text-sm text-muted">
            Positive values mean {nameA} tends to score higher; negative values mean {nameB} tends to score higher.
          </p>
        </div>
      </Step>

      <Step number={6} title="Statistical decision">
        {p === null ? (
          <Notice level="warning">{typographicMinus(interpretation.decisionExplanation)}</Notice>
        ) : (
          <>
            <Formula highlight label="Compare the p-value with α">
              p = {formatPValue(p)} {result.decision === "reject" ? "≤" : ">"} α = {alpha} →{" "}
              <strong>{interpretation.decisionStatement}</strong>
            </Formula>
            {cv.available && (
              <Formula label="Using the critical value">
                {STAT_LABEL[cv.statistic]} = {num(criticalStatValue(result, cv))}{" "}
                {criticalStatValue(result, cv) <= cv.value ? "≤" : ">"} {num(cv.value)} →{" "}
                {criticalStatValue(result, cv) <= cv.value ? "Reject H₀" : "Fail to reject H₀"}
              </Formula>
            )}
            <p>{typographicMinus(interpretation.decisionExplanation)}</p>
          </>
        )}
      </Step>

      <Step number={7} title="Conclusion">
        <p className="rounded-md border-l-[3px] border-accent bg-accent-soft px-4 py-3 text-[17px] leading-relaxed text-ink ring-1 ring-accent-line">{typographicMinus(interpretation.conclusion)}</p>
        <p>{typographicMinus(interpretation.directionStatement)}</p>
        <p className="text-sm text-muted">
          The Mann–Whitney U test compares rank distributions, not means. The result applies to these samples and does not
          establish cause and effect.
        </p>
      </Step>
    </section>
  );
}
