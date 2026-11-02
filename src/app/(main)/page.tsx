import Link from "next/link";
import { ArrowRight, ListOrdered, MonitorPlay, ShieldCheck, Sigma } from "lucide-react";
import { APP_NAME, APP_SUBTITLE } from "@/constants/app";
import { Card, buttonStyles } from "@/components/ui/primitives";
import { Glossary, HowToUse } from "@/components/guide/student-guide";

const FEATURES = [
  {
    icon: ListOrdered,
    title: "Seven-step analysis",
    text: "Hypotheses, significance level, data, test, computation, decision, and conclusion, generated from your data.",
  },
  {
    icon: Sigma,
    title: "Complete computations",
    text: "Average ranks for ties, rank sums, U₁, U₂, tie-corrected normal approximation, and a tie-aware exact p-value.",
  },
  {
    icon: MonitorPlay,
    title: "Presentation Mode",
    text: "A full-screen, step-by-step view of the latest analysis for classroom presentations and recordings.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    text: "All calculations run in your browser. Your data is never sent to a server.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="max-w-3xl pt-2">
        <p className="text-sm font-medium text-accent">{APP_SUBTITLE}</p>
        <h1 className="mt-2 text-4xl tracking-tight text-ink sm:text-5xl">{APP_NAME}</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">
          Test whether two independent groups differ, without assuming normally distributed data. Enter the scores, and
          the calculator ranks the data, computes the U statistic and p-value, and explains each step of the analysis.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/calculator" className={buttonStyles.primary}>
            Open Calculator
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/presentation" className={buttonStyles.secondary}>
            <MonitorPlay className="h-4 w-4" aria-hidden />
            Start Presentation
          </Link>
        </div>
      </section>

      <section aria-label="Features" className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <Card key={title} as="div" className="px-5 py-4">
            <Icon className="h-5 w-5 text-accent" aria-hidden />
            <h2 className="mt-3 font-semibold text-ink">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
          </Card>
        ))}
      </section>

      <HowToUse />
      <Glossary />
    </div>
  );
}
