"use client";

import type { Alternative, PValueMethod } from "@/types/statistics";
import type { AlphaChoice } from "@/hooks/use-calculator";
import { Card, CardHeader } from "@/components/ui/primitives";

const ALPHA_OPTIONS: { value: AlphaChoice; label: string }[] = [
  { value: "0.1", label: "0.10" },
  { value: "0.05", label: "0.05" },
  { value: "0.01", label: "0.01" },
  { value: "custom", label: "Custom" },
];

const METHOD_OPTIONS: { value: PValueMethod; label: string; description: string }[] = [
  {
    value: "asymptotic",
    label: "Asymptotic (normal approximation)",
    description: "Default. z-test with tie-corrected variance; matches the classroom formulas.",
  },
  {
    value: "exact",
    label: "Exact permutation",
    description: "Tie-aware exact p-value. Falls back to the approximation for very large samples.",
  },
  {
    value: "automatic",
    label: "Automatic",
    description: "Exact when it is feasible, otherwise the normal approximation.",
  },
];

function RadioCard({ name, checked, onChange, title, description }: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-md border px-3 py-2.5 transition-colors ${
        checked ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong"
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-1 accent-accent" />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{title}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-muted">{description}</span>}
      </span>
    </label>
  );
}

export function TestConfigCard({
  nameA,
  nameB,
  alphaChoice,
  customAlpha,
  alphaError,
  alternative,
  method,
  continuityCorrection,
  onAlphaChoice,
  onCustomAlpha,
  onAlternative,
  onMethod,
  onContinuityCorrection,
}: {
  nameA: string;
  nameB: string;
  alphaChoice: AlphaChoice;
  customAlpha: string;
  alphaError?: string;
  alternative: Alternative;
  method: PValueMethod;
  continuityCorrection: boolean;
  onAlphaChoice: (v: AlphaChoice) => void;
  onCustomAlpha: (v: string) => void;
  onAlternative: (v: Alternative) => void;
  onMethod: (v: PValueMethod) => void;
  onContinuityCorrection: (v: boolean) => void;
}) {
  const a = nameA.trim() || "Group A";
  const b = nameB.trim() || "Group B";
  const alternatives: { value: Alternative; title: string; description: string }[] = [
    { value: "two-sided", title: "Two-sided (A ≠ B)", description: `${a} and ${b} differ in either direction.` },
    { value: "greater", title: "Group A greater than Group B", description: `${a} tends to have higher scores than ${b}.` },
    { value: "less", title: "Group A less than Group B", description: `${a} tends to have lower scores than ${b}.` },
  ];

  return (
    <Card aria-labelledby="config-title">
      <CardHeader id="config-title" title="Test configuration" description="Settings used for the hypothesis test." />
      <div className="grid gap-6 px-5 py-5 lg:grid-cols-3">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink-soft">Significance level (α)</legend>
          <div className="grid grid-cols-4 overflow-hidden rounded-md border border-line-strong">
            {ALPHA_OPTIONS.map((o, i) => (
              <label
                key={o.value}
                className={`cursor-pointer py-2 text-center font-mono text-sm transition-colors ${
                  i > 0 ? "border-l border-line-strong" : ""
                } ${alphaChoice === o.value ? "bg-accent text-on-accent" : "bg-surface text-ink hover:bg-subtle"} ${
                  o.value === "custom" ? "font-sans" : ""
                } has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-accent`}
              >
                <input
                  type="radio"
                  name="alpha"
                  value={o.value}
                  checked={alphaChoice === o.value}
                  onChange={() => onAlphaChoice(o.value)}
                  className="sr-only"
                />
                {o.label}
              </label>
            ))}
          </div>
          {alphaChoice === "custom" && (
            <div className="mt-3">
              <label htmlFor="custom-alpha" className="mb-1.5 block text-xs font-medium text-muted">
                Custom α (greater than 0, at most 0.5)
              </label>
              <input
                id="custom-alpha"
                type="text"
                inputMode="decimal"
                value={customAlpha}
                onChange={(e) => onCustomAlpha(e.target.value)}
                placeholder="e.g. 0.025"
                aria-invalid={alphaError ? true : undefined}
                aria-describedby={alphaError ? "custom-alpha-error" : undefined}
                className={`w-full rounded-md border bg-surface px-3 py-2 font-mono text-[15px] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 ${
                  alphaError ? "border-danger" : "border-line-strong"
                }`}
              />
              {alphaError && (
                <p id="custom-alpha-error" className="mt-1.5 text-sm text-danger">
                  {alphaError}
                </p>
              )}
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink-soft">Alternative hypothesis (H₁)</legend>
          <div className="space-y-2">
            {alternatives.map((o) => (
              <RadioCard
                key={o.value}
                name="alternative"
                checked={alternative === o.value}
                onChange={() => onAlternative(o.value)}
                title={o.title}
                description={o.description}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink-soft">P-value method</legend>
          <div className="space-y-2">
            {METHOD_OPTIONS.map((o) => (
              <RadioCard
                key={o.value}
                name="method"
                checked={method === o.value}
                onChange={() => onMethod(o.value)}
                title={o.label}
                description={o.description}
              />
            ))}
          </div>
          <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={continuityCorrection}
              onChange={(e) => onContinuityCorrection(e.target.checked)}
              className="mt-0.5 accent-accent"
            />
            <span>
              Continuity correction
              <span className="block text-xs text-muted">Applies to the normal approximation (default: on).</span>
            </span>
          </label>
        </fieldset>
      </div>
    </Card>
  );
}
