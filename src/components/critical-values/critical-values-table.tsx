"use client";

import { useState } from "react";
import type { CriticalValueTable } from "@/lib/statistics/critical-value-table";
import { useSavedAnalysis } from "@/hooks/use-saved-analysis";
import { Card, Notice } from "@/components/ui/primitives";

/** Interactive view of the precomputed critical-value tables, with the last analysis highlighted. */
export function CriticalValuesTable({ tables }: { tables: CriticalValueTable[] }) {
  const [activeId, setActiveId] = useState(tables[0].id);
  const table = tables.find((t) => t.id === activeId) ?? tables[0];
  const saved = useSavedAnalysis();

  // Highlight the sample sizes of the latest calculation, when they fit in the table.
  const n1 = saved.status === "ready" ? saved.result.u.n1 : null;
  const n2 = saved.status === "ready" ? saved.result.u.n2 : null;
  const row = n1 !== null ? table.sizes.indexOf(n1) : -1;
  const col = n2 !== null ? table.sizes.indexOf(n2) : -1;
  const highlighted = row >= 0 && col >= 0 ? table.values[row][col] : undefined;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a table">
        {tables.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveId(t.id)}
            aria-pressed={t.id === table.id}
            className={`rounded-md border px-3.5 py-2 text-sm font-medium transition-colors ${
              t.id === table.id
                ? "border-accent bg-accent text-on-accent"
                : "border-line-strong bg-surface text-ink hover:bg-subtle"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {n1 !== null && n2 !== null && (
        <Notice level="info">
          {highlighted !== undefined ? (
            <>
              Your last analysis: n₁ = {n1}, n₂ = {n2} → critical value ={" "}
              <strong className="font-mono">{highlighted === null ? "— (none)" : highlighted}</strong> ({table.label}).
              It is highlighted in the table.
            </>
          ) : (
            <>
              Your last analysis (n₁ = {n1}, n₂ = {n2}) is outside this table (sizes {table.sizes[0]} to{" "}
              {table.sizes[table.sizes.length - 1]}). Use the p-value decision instead.
            </>
          )}
        </Notice>
      )}

      <Card>
        <div className="border-b border-line px-5 py-3.5">
          <h2 className="text-lg font-semibold text-ink">{table.label}</h2>
          <p className="mt-0.5 text-sm text-muted">
            Rows: n₁ (Group A). Columns: n₂ (Group B). Reject H₀ if U ≤ the value. “—” means no critical value exists
            for those sample sizes at this α.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center font-mono text-sm tabular-nums" data-testid="critical-table">
            <caption className="sr-only">
              Critical values of U, {table.label}. Rows are n₁ and columns are n₂.
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-10 border-b border-r border-line bg-subtle px-2.5 py-2 font-sans text-xs font-semibold whitespace-nowrap text-muted"
                >
                  n₁ \ n₂
                </th>
                {table.sizes.map((n, j) => (
                  <th
                    key={n}
                    scope="col"
                    className={`border-b border-line px-2.5 py-2 font-semibold ${
                      j === col ? "bg-accent text-on-accent" : "bg-subtle text-ink"
                    }`}
                  >
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.values.map((rowValues, i) => (
                <tr key={table.sizes[i]}>
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 border-r border-line px-2.5 py-1.5 font-semibold ${
                      i === row ? "bg-accent text-on-accent" : "bg-subtle text-ink"
                    }`}
                  >
                    {table.sizes[i]}
                  </th>
                  {rowValues.map((v, j) => {
                    const isCell = i === row && j === col;
                    const inCross = i === row || j === col;
                    return (
                      <td
                        key={j}
                        data-highlighted={isCell || undefined}
                        className={`border-b border-line/60 px-2.5 py-1.5 ${
                          isCell
                            ? "bg-accent font-bold text-on-accent"
                            : inCross
                              ? "bg-accent-soft text-ink"
                              : v === null
                                ? "text-muted/60"
                                : "text-ink"
                        }`}
                      >
                        {v === null ? "—" : v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
