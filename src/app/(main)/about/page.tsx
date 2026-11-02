import type { Metadata } from "next";
import { Card, CardHeader, Formula, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Method Notes" };

interface ProcedureStep {
  title: string;
  text: string;
  /** Numbered sub-steps, written out in full sentences. */
  substeps?: string[];
  formulas?: string[];
  /** Highlight the formulas as key results. */
  key?: boolean;
}

/**
 * The seven steps, in the same order as the calculator's analysis.
 * Written in full words (no abbreviations) so students can study from it.
 */
const PROCEDURE: ProcedureStep[] = [
  {
    title: "State the hypotheses",
    text: "Write the null hypothesis (H₀) and the alternative hypothesis (H₁). The null hypothesis says there is no difference between the two groups. The alternative hypothesis says there is a difference.",
    substeps: [
      "Two-tailed (two-sided) test: H₁ says the groups differ, without saying which group is higher.",
      "One-tailed (one-sided) test: H₁ states a direction, for example: “The scores of Group A tend to be higher than the scores of Group B.”",
    ],
    formulas: [
      "H₀: There is no significant difference between the two groups.",
      "H₁: There is a significant difference between the two groups.",
    ],
  },
  {
    title: "Set the level of significance",
    text: "Choose alpha (α), the level of significance. Alpha is the risk we accept of rejecting the null hypothesis when it is actually true (a Type I error). The usual choice is 0.05, which means a 5% risk.",
    formulas: ["α = 0.05"],
  },
  {
    title: "List the given data",
    text: "Write the scores of each group and count how many scores each group has.",
    substeps: [
      "n₁ is the number of scores in Group A.",
      "n₂ is the number of scores in Group B.",
      "N is the total number of scores in both groups.",
    ],
    formulas: ["N = n₁ + n₂"],
  },
  {
    title: "Name the statistical test",
    text: "Use the Mann–Whitney U test. It is a nonparametric test for two independent samples: the two groups contain different people, and the data do not need to follow a normal distribution. The test compares the ranks of the scores, not their means.",
  },
  {
    title: "Compute the test statistic",
    text: "Follow these steps in order.",
    substeps: [
      "Combine the scores of both groups into one list.",
      "Sort the combined list from the lowest score to the highest score.",
      "Give each score a rank: the lowest score gets rank 1, the next gets rank 2, and so on up to N.",
      "If two or more scores are equal (tied), give each of them the average of the positions they occupy. For example, if two scores share positions 4 and 5, each gets rank (4 + 5) ÷ 2 = 4.5.",
      "Add the ranks that belong to Group A to get R₁, and the ranks that belong to Group B to get R₂. Check: R₁ + R₂ must equal N(N + 1) ÷ 2.",
      "Compute U₁ for Group A and U₂ for Group B with the formulas below. Check: U₁ + U₂ must equal n₁ × n₂.",
      "The test statistic U is the smaller of U₁ and U₂.",
      "Find the p-value. With the normal approximation, compute the mean of U (μ), the standard deviation of U (σ), and the z-score, then read the probability from the standard normal table.",
    ],
    formulas: [
      "U₁ = R₁ − n₁(n₁ + 1) ÷ 2",
      "U₂ = R₂ − n₂(n₂ + 1) ÷ 2",
      "U = the smaller of U₁ and U₂",
      "Mean of U:  μ = (n₁ × n₂) ÷ 2",
      "Standard deviation of U (no ties):  σ = √[ n₁ × n₂ × (N + 1) ÷ 12 ]",
      "z = (U₁ − μ ± 0.5) ÷ σ     (the 0.5 is the continuity correction, applied toward zero)",
      "Two-tailed p-value = 2 × (probability that Z is at least as large as |z|)",
    ],
    key: true,
  },
  {
    title: "Make the statistical decision",
    text: "Compare the p-value with alpha.",
    substeps: [
      "If the p-value is less than or equal to alpha, reject the null hypothesis.",
      "If the p-value is greater than alpha, fail to reject the null hypothesis. This does not prove the null hypothesis is true; it means the sample does not give enough evidence against it.",
      "Using the critical-value method instead: reject the null hypothesis if U is less than or equal to the critical value from the Mann–Whitney table. Both methods give the same decision.",
    ],
    formulas: ["p ≤ α  →  Reject H₀", "p > α  →  Fail to reject H₀"],
    key: true,
  },
  {
    title: "Write the conclusion",
    text: "State the result in complete sentences, using the names of the groups, the values of U and p, and which group tended to have higher scores. Describe only what the sample shows. Do not claim that one group is better in general, or that one thing caused the difference.",
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
                  {step.substeps && (
                    <ol className="list-[lower-alpha] space-y-1 pl-6 marker:text-muted">
                      {step.substeps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                  )}
                  {step.formulas && (
                    <div className="space-y-1.5">
                      {step.formulas.map((f) => (
                        <Formula key={f} highlight={step.key}>
                          {f}
                        </Formula>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Section title="Ranking and U statistics">
          <p>Both groups are combined and sorted in ascending order. Ranks start at 1; tied scores receive the average of the positions they occupy (for example, the scores 10, 12, 12, 15 get the ranks 1, 2.5, 2.5, 4).</p>
          <Formula>U₁ = R₁ − n₁(n₁ + 1) / 2 &nbsp;&nbsp; U₂ = R₂ − n₂(n₂ + 1) / 2 &nbsp;&nbsp; U = the smaller of U₁ and U₂</Formula>
          <p>Checks performed on every calculation: R₁ + R₂ = N(N + 1)/2 and U₁ + U₂ = n₁n₂. Group A is always group 1.</p>
        </Section>

        <Section title="Normal approximation (default)">
          <Formula>μ = n₁n₂ / 2 &nbsp;&nbsp; σ² = (n₁n₂ / 12)·[(N + 1) − Σ(t³ − t) / (N(N − 1))]</Formula>
          <p>t is the number of observations sharing a tied value. The continuity correction (on by default) moves U₁ − μ by 0.5 toward zero for the chosen alternative, the same convention as R&apos;s <code>wilcox.test(correct = TRUE)</code>. Two-sided p-value = 2 × the smaller of Φ(z) and 1 − Φ(z), where Φ(z) is the probability that a standard normal value is at most z. A warning is shown when either group has fewer than 10 observations.</p>
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
