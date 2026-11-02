import { Calculator, ClipboardList, MonitorPlay, SlidersHorizontal } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/primitives";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Enter the Scores",
    text: "Type or paste each group's scores, separated by commas or new lines. Not sure? Press Load Sample Data.",
  },
  {
    icon: SlidersHorizontal,
    title: "Check the Settings",
    text: "The defaults (α = 0.05, two-sided, normal approximation) fit most class problems. Change them only if your problem says so.",
  },
  {
    icon: Calculator,
    title: "Press Calculate",
    text: "Read the decision first, then press Show Solution to see the full seven-step solution and how every number was found.",
  },
  {
    icon: MonitorPlay,
    title: "Present",
    text: "Press Start Presentation for full-screen slides. Use the arrow keys to move between slides.",
  },
];

/** Four-step "how to use" strip for students. */
export function HowToUse({ compact = false }: { compact?: boolean }) {
  return (
    <section aria-labelledby="how-to-use-title" className={compact ? "mb-8" : ""}>
      <h2 id="how-to-use-title" className={compact ? "sr-only" : "mb-4 text-2xl text-ink"}>
        How to Use
      </h2>
      <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="flex gap-3 rounded-lg border border-line bg-surface/80 px-4 py-3.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-sm font-semibold text-accent">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-medium text-ink">
                <Icon className="h-4 w-4 text-accent" aria-hidden />
                {title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const TERMS: { term: string; meaning: string }[] = [
  { term: "Independent groups", meaning: "Two separate sets of people or items. Nobody appears in both groups." },
  { term: "Rank", meaning: "A score's position after sorting all scores from lowest (rank 1) to highest." },
  { term: "Tied ranks", meaning: "Equal scores share the average of the positions they occupy. For example, two scores in positions 4 and 5 both get rank 4.5." },
  { term: "R₁, R₂ (rank sums)", meaning: "The total of the ranks in Group A and in Group B." },
  { term: "U statistic", meaning: "Counts how often a score from one group is higher than a score from the other. The smaller U is the test statistic." },
  { term: "α (significance level)", meaning: "The risk we accept of saying there is a difference when there really is none. Usually 0.05 (5%)." },
  { term: "p-value", meaning: "If there were truly no difference, the chance of getting results at least this extreme. Small p (≤ α) → reject H₀." },
  { term: "H₀ and H₁", meaning: "H₀: no difference between the groups. H₁: there is a difference (or a difference in a stated direction)." },
  { term: "Effect size", meaning: "How big the difference is, from about 0 (none) to ±1 (complete separation). Not just whether it exists." },
];

/** Plain-language glossary of the terms used in the results. */
export function Glossary() {
  return (
    <Card aria-labelledby="glossary-title">
      <CardHeader id="glossary-title" title="Key Terms in Plain Words" description="Read these once before your first analysis." />
      <dl className="grid gap-x-8 px-5 py-2 md:grid-cols-2">
        {TERMS.map(({ term, meaning }) => (
          <div key={term} className="border-b border-line py-3 last:border-b-0 md:[&:nth-last-child(2)]:border-b-0">
            <dt className="font-medium text-ink">{term}</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-ink-soft">{meaning}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
