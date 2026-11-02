import type { ReactNode } from "react";
import type { MannWhitneyResult } from "@/types/statistics";
import { APP_SUBTITLE } from "@/constants/app";
import { SAMPLE_INPUT, SAMPLE_RESEARCH_PROBLEM } from "@/constants/sample-data";
import { displayNumber, formatAlpha, formatFixed, formatPValue, typographicMinus, withMinus } from "@/lib/utils/format";
import { methodDescription, methodName } from "@/lib/utils/result-labels";
import { GroupDot } from "@/components/ui/primitives";
import { SlideFormula, SlideHeading, SlideLabel, SlidePanel, SlideWarning } from "./slide-parts";

export interface SlideProps {
  result: MannWhitneyResult;
}

export interface SlideDefinition {
  title: string;
  render: (props: SlideProps) => ReactNode;
}

const num = (v: number) => displayNumber(v);
const fx = (v: number, d = 4) => withMinus(formatFixed(v, d));
const MAX_RANK_CHIPS = 40;

function researchProblem(result: MannWhitneyResult): string {
  const { groupA, groupB } = result.input;
  if (groupA.name === SAMPLE_INPUT.groupA.name && groupB.name === SAMPLE_INPUT.groupB.name) return SAMPLE_RESEARCH_PROBLEM;
  return `Is there a statistically significant difference in scores between ${groupA.name} and ${groupB.name}?`;
}

/* ---------- 1. Title ---------- */
function TitleSlide({ result }: SlideProps) {
  return (
    <div className="st-gap flex flex-col">
      <div>
        <p className="st-small font-medium tracking-wide text-accent uppercase">{APP_SUBTITLE}</p>
        <h1 className="st-hero mt-[0.25em] font-semibold tracking-tight text-ink">Mann–Whitney U Test</h1>
        <p className="st-lead mt-[0.8em] max-w-[52em] text-ink-soft md:max-w-[32em]">
          A nonparametric test of whether two independent groups differ, based on the ranks of their scores rather than
          on the raw values. Today: <strong className="font-semibold text-ink">{result.input.groupA.name}</strong> versus{" "}
          <strong className="font-semibold text-ink">{result.input.groupB.name}</strong>.
        </p>
      </div>
    </div>
  );
}

/* ---------- 2. Research problem and data ---------- */
function ResearchSlide({ result }: SlideProps) {
  const groups = [
    { key: "A" as const, g: result.input.groupA, sub: "₁" },
    { key: "B" as const, g: result.input.groupB, sub: "₂" },
  ];
  return (
    <div className="st-gap flex flex-col">
      <SlideHeading>Research Problem and Data</SlideHeading>
      <p className="st-lead max-w-[56em] text-ink-soft">{researchProblem(result)}</p>
      <div className="st-gap grid md:grid-cols-2">
        {groups.map(({ key, g, sub }) => (
          <SlidePanel key={key}>
            <p className="st-body flex items-center gap-[0.5em] font-semibold text-ink">
              <GroupDot group={key} />
              Group {key}: {g.name}
            </p>
            {g.description && <p className="st-small mt-[0.2em] text-muted">{g.description}</p>}
            <p className="st-formula mt-[0.7em] font-mono wrap-break-word text-ink">
              {g.values.map((v) => displayNumber(v, 6)).join(", ")}
            </p>
            <p className="st-small mt-[0.6em] font-mono text-ink-soft">
              n{sub} = {g.values.length}
            </p>
          </SlidePanel>
        ))}
      </div>
      <p className="st-small text-muted">
        The two groups are independent: each observation belongs to exactly one group, and no participant appears in
        both groups.
      </p>
    </div>
  );
}

/* ---------- 3. Hypotheses ---------- */
function HypothesesSlide({ result }: SlideProps) {
  const { interpretation, config } = result;
  const twoSided = config.alternative === "two-sided";
  return (
    <div className="st-gap flex flex-col">
      <SlideHeading>Hypotheses</SlideHeading>
      <SlidePanel>
        <SlideLabel>Null hypothesis (H₀)</SlideLabel>
        <p className="st-lead text-ink">{interpretation.nullHypothesis}</p>
      </SlidePanel>
      <SlidePanel tone="accent">
        <SlideLabel>Alternative hypothesis (H₁)</SlideLabel>
        <p className="st-lead text-ink">{interpretation.alternativeHypothesis}</p>
      </SlidePanel>
      <p className="st-body max-w-[60em] text-ink-soft">
        {twoSided ? (
          <>
            <strong className="text-ink">Two-tailed test.</strong> H₁ does not state a direction, so a large difference
            in either direction counts as evidence against H₀. Extreme results in both tails of the distribution are
            used to compute the p-value.
          </>
        ) : (
          <>
            <strong className="text-ink">One-tailed test.</strong> H₁ states a direction, so only results in that
            direction count as evidence against H₀.
          </>
        )}
      </p>
    </div>
  );
}

/* ---------- 4. Level of significance ---------- */
function SignificanceSlide({ result }: SlideProps) {
  const a = result.config.alpha;
  const alpha = formatAlpha(a);
  const percent = displayNumber(a * 100, 4);
  return (
    <div className="st-gap flex flex-col">
      <SlideHeading>Level of Significance</SlideHeading>
      <p className="st-hero font-mono font-semibold text-accent">α = {alpha}</p>
      <ul className="st-body max-w-[60em] list-disc space-y-[0.5em] pl-[1.2em] text-ink-soft marker:text-accent">
        <li>
          We accept a <strong className="text-ink">{percent}% risk</strong> of rejecting H₀ when it is actually true
          (a Type I error).
        </li>
        <li>
          Decision rule: <strong className="text-ink">reject H₀ if p ≤ {alpha}</strong>; otherwise, fail to reject H₀.
        </li>
        {result.config.alternative === "two-sided" && (
          <li>
            Because the test is two-tailed, this risk is shared between both tails ({formatAlpha(a / 2)} in each).
          </li>
        )}
      </ul>
    </div>
  );
}

/* ---------- 5. Test statistic and ranking ---------- */
function RankingSlide({ result }: SlideProps) {
  const { ranking, u } = result;
  const firstTie = ranking.tieGroups[0];
  const showChips = ranking.sorted.length <= MAX_RANK_CHIPS;
  return (
    <div className="st-gap flex flex-col">
      <SlideHeading>Mann–Whitney U Test: Ranking the Scores</SlideHeading>
      <p className="st-body max-w-[64em] text-ink-soft">
        A nonparametric test for two independent samples. All {u.N} scores are combined, sorted from lowest to highest,
        and ranked from 1 to {u.N}. Tied scores receive the <strong className="text-ink">average</strong> of the
        positions they occupy.
      </p>

      {showChips ? (
        <div>
          <div className="grid grid-cols-5 gap-[0.4em] sm:grid-cols-10" aria-label="Sorted scores with ranks">
            {ranking.sorted.map((o) => (
              <div
                key={o.id}
                className={`rounded-md border-t-4 px-[0.4em] py-[0.35em] text-center ${
                  o.group === "A" ? "border-t-group-a" : "border-t-group-b"
                } ${o.tied ? "bg-warn-soft" : "bg-subtle"}`}
              >
                <p className="st-body font-mono font-semibold text-ink">{displayNumber(o.value, 6)}</p>
                <p className="st-small text-muted">
                  rank <span className="font-mono">{num(o.rank)}</span>
                </p>
              </div>
            ))}
          </div>
          <p className="st-small mt-[0.6em] flex flex-wrap items-center gap-x-[1.2em] gap-y-[0.3em] text-muted">
            <span className="flex items-center gap-[0.4em]"><GroupDot group="A" /> {result.input.groupA.name}</span>
            <span className="flex items-center gap-[0.4em]"><GroupDot group="B" /> {result.input.groupB.name}</span>
            {ranking.hasTies && <span>Shaded = tied score</span>}
          </p>
        </div>
      ) : (
        <p className="st-small text-muted">The full ranking table is shown in Step 5 of the calculator.</p>
      )}

      <div className="st-gap grid items-start md:grid-cols-2">
        {firstTie && (
          <SlideFormula
            label={`Example of a tie: score ${displayNumber(firstTie.value, 6)} occupies positions ${Array.from(
              { length: firstTie.count },
              (_, i) => firstTie.firstPosition + i,
            ).join(" and ")}`}
          >
            ({Array.from({ length: firstTie.count }, (_, i) => firstTie.firstPosition + i).join(" + ")}) / {firstTie.count} ={" "}
            {num(firstTie.rank)}
          </SlideFormula>
        )}
        <div className="space-y-[0.6em]">
          <SlideFormula label={`Rank sum of ${result.input.groupA.name}`} strong>R₁ = {num(u.R1)}</SlideFormula>
          <SlideFormula label={`Rank sum of ${result.input.groupB.name}`} strong>R₂ = {num(u.R2)}</SlideFormula>
          <p className="st-small font-mono text-muted">
            Check: R₁ + R₂ = {num(u.R1 + u.R2)} = N(N + 1)/2 ✓
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- 6. Computation ---------- */
function ComputationSlide({ result }: SlideProps) {
  const { u, asymptotic, exact, config, ranking } = result;
  const alt = config.alternative;
  const corr = asymptotic.computable ? asymptotic.correctionApplied : 0;
  const corrText = corr > 0 ? " − 0.5" : corr < 0 ? " + 0.5" : "";
  const exactKey = alt === "two-sided" ? "twoSided" : alt;

  const asymptoticFormulas = asymptotic.computable && (
    <div className="space-y-[0.7em]">
      <SlideFormula label="Mean of U">μ = n₁n₂ / 2 = {num(asymptotic.mean)}</SlideFormula>
      <SlideFormula label={ranking.hasTies ? "Standard deviation (tie-corrected)" : "Standard deviation"}>
        σ = √{fx(asymptotic.variance)} = {fx(asymptotic.standardDeviation)}
      </SlideFormula>
      <SlideFormula label={corr !== 0 ? "z (with continuity correction)" : "z"}>
        z = ({num(u.U1)} − {num(asymptotic.mean)}{corrText}) / {fx(asymptotic.standardDeviation)} = {fx(asymptotic.z)}
      </SlideFormula>
      <SlideFormula label={alt === "two-sided" ? "Two-tailed p-value" : "One-tailed p-value"} strong>
        {alt === "two-sided" && <>p = 2 × P(Z ≥ {fx(Math.abs(asymptotic.z))}) = {formatPValue(asymptotic.pValue)}</>}
        {alt === "greater" && <>p = P(Z ≥ {fx(asymptotic.z)}) = {formatPValue(asymptotic.pValue)}</>}
        {alt === "less" && <>p = P(Z ≤ {fx(asymptotic.z)}) = {formatPValue(asymptotic.pValue)}</>}
      </SlideFormula>
    </div>
  );

  const exactFormulas = exact.feasible && (
    <div className="space-y-[0.7em]">
      <p className="st-body text-ink-soft">
        Every split of the {u.N} ranks into groups of {u.n1} and {u.n2} is equally likely under H₀; tied ranks are kept
        as observed.
      </p>
      <SlideFormula label="Exact p-value" strong>p = {formatPValue(exact.pValues[exactKey])}</SlideFormula>
    </div>
  );

  return (
    <div className="st-gap flex flex-col">
      <SlideHeading>Computing U and the p-value</SlideHeading>
      <div className="st-gap grid lg:grid-cols-2">
        <SlidePanel>
          <p className="st-body mb-[0.7em] font-semibold text-ink">U statistics</p>
          <div className="space-y-[0.7em]">
            <SlideFormula label="U for Group A">
              U₁ = R₁ − n₁(n₁ + 1)/2 = {num(u.R1)} − {num((u.n1 * (u.n1 + 1)) / 2)} = {num(u.U1)}
            </SlideFormula>
            <SlideFormula label="U for Group B">
              U₂ = R₂ − n₂(n₂ + 1)/2 = {num(u.R2)} − {num((u.n2 * (u.n2 + 1)) / 2)} = {num(u.U2)}
            </SlideFormula>
            <SlideFormula label="Test statistic" strong>
              U = smaller of (U₁, U₂) = smaller of ({num(u.U1)}, {num(u.U2)}) = {num(u.U)}
            </SlideFormula>
          </div>
        </SlidePanel>
        <SlidePanel tone="accent">
          <p className="st-body mb-[0.7em] font-semibold text-ink">{methodDescription(result)}</p>
          {result.methodUsed === "exact" ? exactFormulas : asymptoticFormulas}
          {result.methodUsed === null && <p className="st-body text-ink-soft">No p-value could be calculated.</p>}
        </SlidePanel>
      </div>
      {result.secondaryPValue && (
        <p className="st-small text-muted">
          For comparison, the {methodName(result.secondaryPValue.method).toLowerCase()} gives p ={" "}
          {formatPValue(result.secondaryPValue.value)}.
        </p>
      )}
    </div>
  );
}

/* ---------- 7. Decision ---------- */
function DecisionSlide({ result }: SlideProps) {
  const { pValue, config, decision, interpretation, criticalValue: cv, conventionalCriticalValue: conv, u, ranking } = result;
  const alpha = formatAlpha(config.alpha);
  const reject = decision === "reject";
  const stat = cv.available ? (cv.statistic === "U1" ? u.U1 : cv.statistic === "U2" ? u.U2 : u.U) : null;
  const statLabel = cv.available ? { U: "U", U1: "U₁", U2: "U₂" }[cv.statistic] : "";
  return (
    <div className="st-gap flex flex-col">
      <SlideHeading>Statistical Decision</SlideHeading>
      {pValue === null ? (
        <p className="st-lead text-ink-soft">{typographicMinus(interpretation.decisionExplanation)}</p>
      ) : (
        <>
          <div className="st-gap flex flex-wrap items-center">
            <p className="st-big font-mono font-semibold text-ink">
              p = {formatPValue(pValue)} {reject ? "≤" : ">"} α = {alpha}
            </p>
            <p
              className={`st-title rounded-lg px-[0.6em] py-[0.2em] font-semibold ${
                reject ? "bg-accent text-on-accent" : "bg-subtle text-ink"
              }`}
              data-testid="slide-decision"
            >
              {interpretation.decisionStatement}
            </p>
          </div>
          <p className="st-body max-w-[62em] text-ink-soft">
            If H₀ were true, a result at least this extreme would occur with probability {formatPValue(pValue)}.{" "}
            {reject
              ? `This is at or below α = ${alpha}, so we reject H₀.`
              : `This is above α = ${alpha}, so we fail to reject H₀. This does not prove H₀ is true.`}
          </p>
        </>
      )}
      <div className="st-gap grid md:grid-cols-2">
        <SlidePanel>
          <SlideLabel>Critical value {ranking.hasTies ? "(exact, tie-aware)" : "(exact)"}</SlideLabel>
          {cv.available && stat !== null ? (
            <p className="st-formula font-mono text-ink">
              {cv.rule} → {statLabel} = {num(stat)} {stat <= cv.value ? "≤" : ">"} {num(cv.value)}
            </p>
          ) : (
            <p className="st-body text-ink-soft">{cv.available ? "" : cv.message}</p>
          )}
        </SlidePanel>
        {ranking.hasTies && conv.available && (
          <SlideWarning>
            <strong>Conventional table value: {num(conv.value)}</strong> ({conv.rule.replace("Reject H₀ if ", "")}). Tables
            assume no ties. This dataset contains ties, so the table value is a reference only; the decision uses the
            tie-corrected p-value.
          </SlideWarning>
        )}
      </div>
    </div>
  );
}

/* ---------- 8. Conclusion ---------- */
function ConclusionSlide({ result }: SlideProps) {
  const { interpretation, effectSizes, descriptives, u } = result;
  const nameA = result.input.groupA.name;
  const nameB = result.input.groupB.name;
  return (
    <div className="st-gap flex flex-col">
      <SlideHeading>Conclusion</SlideHeading>
      <p className="st-lead st-pad max-w-[64em] rounded-lg border-l-4 border-accent bg-accent-soft text-ink ring-1 ring-accent-line">{typographicMinus(interpretation.conclusion)}</p>
      <div className="grid gap-[0.8em] sm:grid-cols-3">
        <SlidePanel tone="subtle">
          <SlideLabel>Mean rank</SlideLabel>
          <p className="st-body text-ink tabular-nums">
            {nameA}: {fx(u.meanRankA, 2)}
            <br />
            {nameB}: {fx(u.meanRankB, 2)}
          </p>
        </SlidePanel>
        <SlidePanel tone="subtle">
          <SlideLabel>Median score</SlideLabel>
          <p className="st-body text-ink tabular-nums">
            {nameA}: {num(descriptives.A.median)}
            <br />
            {nameB}: {num(descriptives.B.median)}
          </p>
        </SlidePanel>
        <SlidePanel tone="subtle">
          <SlideLabel>Effect size</SlideLabel>
          <p className="st-body text-ink tabular-nums">
            r<sub>rb</sub> = {fx(effectSizes.rankBiserial, 2)} ({effectSizes.rankBiserialMagnitude})
          </p>
        </SlidePanel>
      </div>
      <p className="st-small max-w-[64em] text-muted">
        These results describe the observed samples. They do not show that one approach is better in general, and this
        analysis alone does not establish cause and effect. The Mann–Whitney U test compares rank distributions, not
        means.
      </p>
    </div>
  );
}

export const SLIDES: SlideDefinition[] = [
  { title: "Mann–Whitney U Test", render: (p) => <TitleSlide {...p} /> },
  { title: "Research Problem and Data", render: (p) => <ResearchSlide {...p} /> },
  { title: "Hypotheses", render: (p) => <HypothesesSlide {...p} /> },
  { title: "Level of Significance", render: (p) => <SignificanceSlide {...p} /> },
  { title: "Test Statistic and Ranking", render: (p) => <RankingSlide {...p} /> },
  { title: "Computation", render: (p) => <ComputationSlide {...p} /> },
  { title: "Statistical Decision", render: (p) => <DecisionSlide {...p} /> },
  { title: "Conclusion", render: (p) => <ConclusionSlide {...p} /> },
];
