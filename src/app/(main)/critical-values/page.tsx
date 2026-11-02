import type { Metadata } from "next";
import { PageHeader, Card, CardHeader } from "@/components/ui/primitives";
import { CriticalValuesTable } from "@/components/critical-values/critical-values-table";
import { buildAllCriticalValueTables } from "@/lib/statistics/critical-value-table";

export const metadata: Metadata = { title: "Critical Values Table" };

// Computed once when the site is built (no work in the browser).
const TABLES = buildAllCriticalValueTables();

export default function CriticalValuesPage() {
  return (
    <>
      <PageHeader
        title="Critical Values Table"
        description="Critical values of U for the Mann–Whitney U test, for sample sizes 2 to 20. Computed exactly from the U distribution, so they match the standard tables in statistics books."
      />
      <div className="space-y-5">
        <Card>
          <CardHeader title="How to Use This Table" />
          <ol className="list-decimal space-y-1.5 py-4 pr-5 pl-10 text-[15px] leading-relaxed text-ink-soft">
            <li>Choose the table that matches your test: two-tailed or one-tailed, and your α.</li>
            <li>Find the row for n₁ (size of Group A) and the column for n₂ (size of Group B).</li>
            <li>Compare your U (the smaller of U₁ and U₂) with the value in that cell.</li>
            <li>
              If U is <strong className="text-ink">less than or equal to</strong> the critical value, reject H₀.
              Otherwise, fail to reject H₀.
            </li>
          </ol>
          <p className="border-t border-line px-5 py-3 text-sm text-muted">
            Example: n₁ = 10, n₂ = 10, two-tailed, α = 0.05 → critical value 23. Since U = 5 ≤ 23, reject H₀. These
            tables assume there are no tied scores; when your data have ties, the calculator also gives a tie-aware
            critical value and the p-value.
          </p>
        </Card>
        <CriticalValuesTable tables={TABLES} />
      </div>
    </>
  );
}
