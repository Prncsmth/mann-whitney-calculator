import type { Metadata } from "next";
import { Card, CardHeader, Formula, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Method Notes" };

/** The seven steps, in the same order as the calculator's analysis. */
const PROCEDURE: { title: string; text: string; formula?: string; key?: boolean }[] = [
  {
    title: "State the hypotheses",
    text: "Write H₀ (no difference between the two groups) and H₁ (there is a difference). For a one-sided test, H₁ states a direction, e.g. Group A tends to score higher than Group B.",
    formula: "H₀: no difference      H₁: there is a difference (two-sided)",
  },
  {
    title: "Set the level of significance",
    text: "Choose α, the risk you accept of rejecting H₀ when it is actually true. The usual choice is 0.05.",
    formula: "α = 0.05",
  },
  {
    title: "List the given data",
    text: "Write the scores of each group and count them: n₁ for Group A, n₂ for Group B, and N = n₁ + n₂.",
    formula: "N = n₁ + n₂",
  },
  {
    title: "Name the statistical test",
    text: "Mann–Whitney U test: a nonparametric test for two independent samples. It uses ranks, so the data do not need to be normally distributed.",
  },
  {
    title: "Compute the test statistic",
    text: "Combine all scores, sort them from lowest to highest, and rank them from 1 to N. Tied scores get the average of their positions. Add the ranks of each group (R₁, R₂), compute U₁ and U₂, and take the smaller one. Then find the p-value (normal approximation: z = (U₁ − μ ± 0.5) / σ).",
    formula: "U₁ = R₁ − n₁(n₁ + 1)/2    U₂ = R₂ − n₂(n₂ + 1)/2    U = min(U₁, U₂)",
    key: true,
  },
  {
    title: "Make the statistical decision",
    text: "Compare the p-value with α. If p ≤ α, reject H₀. If p > α, fail to reject H₀ (this does not prove H₀ is true). You can also compare U with the critical value: reject H₀ if U ≤ critical value.",
    formula: "p ≤ α → Reject H₀      p > α → Fail to reject H₀",
    key: true,
  },
  {
    title: "Write the conclusion",
    text: "State the result in words using the group names, the U and p values, and which group tended to score higher. Describe only the observed samples; do not claim that one group is better in general or that one caused the other.",
  },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="space-y-3 px-5 py-4 text-[15px] leading-relaxed text-ink-soft">{children}</div>
    </Card>
  );
}

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="Method Notes"
        description="The seven steps of the Mann–Whitney U test, followed by the exact formulas and conventions this calculator uses, so results can be checked by hand."
      />
      <div className="space-y-5">
        <Card aria-labelledby="procedure-title">
          <CardHeader
            id="procedure-title"
            title="The seven-step procedure"
            description="The steps the calculator follows. You can use them to solve a problem by hand."
          />
          <ol className="divide-y divide-line">
            {PROCEDURE.map((step, i) => (
              <li key={step.title} className="flex gap-4 px-5 py-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent font-mono text-sm font-semibold text-on-accent">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-2 text-[15px] leading-relaxed text-ink-soft">
                  <h3 className="text-lg text-ink">{step.title}</h3>
                  <p>{step.text}</p>
                  {step.formula && <Formula highlight={step.key}>{step.formula}</Formula>}
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Section title="Ranking and U statistics">
          <p>Both groups are combined and sorted in ascending order. Ranks start at 1; tied scores receive the average of the positions they occupy (e.g. 10, 12, 12, 15 → 1, 2.5, 2.5, 4).</p>
          <Formula>U₁ = R₁ − n₁(n₁ + 1) / 2 &nbsp;&nbsp; U₂ = R₂ − n₂(n₂ + 1) / 2 &nbsp;&nbsp; U = min(U₁, U₂)</Formula>
          <p>Checks performed on every calculation: R₁ + R₂ = N(N + 1)/2 and U₁ + U₂ = n₁n₂. Group A is always group 1.</p>
        </Section>

        <Section title="Normal approximation (default)">
          <Formula>μ = n₁n₂ / 2 &nbsp;&nbsp; σ² = (n₁n₂ / 12)·[(N + 1) − Σ(t³ − t) / (N(N − 1))]</Formula>
          <p>t is the number of observations sharing a tied value. The continuity correction (on by default) moves U₁ − μ by 0.5 toward zero for the chosen alternative, the same convention as R&apos;s <code>wilcox.test(correct = TRUE)</code>. Two-sided p = 2·min(Φ(z), 1 − Φ(z)). A warning is shown when either group has fewer than 10 observations.</p>
        </Section>

        <Section title="Exact permutation test">
          <p>Under H₀ every split of the pooled observations into groups of size n₁ and n₂ is equally likely. The calculator counts all C(N, n₁) splits exactly, keeping the observed tied ranks, so ties are handled correctly. It uses a counting method that gives the same result as listing every split.</p>
          <Formula>two-sided p = P(|U₁ − n₁n₂/2| ≥ |u₁ − n₁n₂/2|)</Formula>
          <p>The two-sided p-value counts outcomes at least as extreme as the observed one in either direction; it is not computed by doubling a one-sided p-value. If the exact distribution is too large to compute quickly (roughly more than 75 observations per group), the normal approximation is used and this is stated with the results.</p>
        </Section>

        <Section title="Critical values">
          <p>The critical value is the largest value c with P(U ≤ c) ≤ α under the exact null distribution of the entered data (tie-aware). For one-sided tests, it applies to U₁ (Group A less than Group B) or U₂ (Group A greater than Group B). When the data contain ties, the conventional table value (which assumes no ties) is shown separately as a reference only. If no outcome is extreme enough, the calculator says so and the p-value decision is used.</p>
        </Section>

        <Section title="Effect sizes">
          <Formula>r_rb = (U₁ − U₂) / (n₁n₂) &nbsp;&nbsp; r = z / √N</Formula>
          <p>z is the uncorrected z (no continuity correction, tie-corrected variance). Positive values mean Group A tends to score higher; negative values mean Group B tends to score higher. Magnitude labels follow Cohen&apos;s thresholds: below 0.1 negligible, 0.1 small, 0.3 medium, 0.5 large. Effect sizes describe the observed samples and do not imply causation.</p>
        </Section>

        <Section title="Interpretation">
          <p>If p ≤ α, H₀ is rejected; otherwise we fail to reject H₀. Failing to reject does not prove H₀. The Mann–Whitney U test compares rank distributions, not means. When the two distributions have a similar shape, a significant result can be described as a difference in location.</p>
        </Section>
      </div>
    </>
  );
}
