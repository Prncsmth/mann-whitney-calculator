"use client";

import { Eraser } from "lucide-react";
import type { GroupFormValues, GroupValidation } from "@/lib/validation/validate-analysis";
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from "@/lib/validation/schemas";
import { Card, GroupDot, buttonStyles } from "@/components/ui/primitives";

const MAX_LISTED_ERRORS = 6;

const inputClass =
  "w-full rounded-md border bg-surface px-3 py-2 text-[15px] text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15";

export function GroupInputCard({
  group,
  label,
  subscript,
  values,
  validation,
  showFieldErrors,
  onChange,
  onClear,
}: {
  group: "A" | "B";
  label: string;
  /** "1" or "2", used in n₁ / n₂. */
  subscript: "1" | "2";
  values: GroupFormValues;
  validation: GroupValidation;
  showFieldErrors: boolean;
  onChange: (field: keyof GroupFormValues, value: string) => void;
  onClear: () => void;
}) {
  const id = `group-${group.toLowerCase()}`;
  const { entryErrors, fieldErrors } = validation;
  const n = validation.values.length;
  const valuesError = entryErrors.length > 0 || showFieldErrors ? fieldErrors.values : undefined;
  const nameError = showFieldErrors ? fieldErrors.name : undefined;
  const descriptionError = fieldErrors.description;
  const sub = subscript === "1" ? "₁" : "₂";

  return (
    <Card aria-labelledby={`${id}-title`}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h3 id={`${id}-title`} className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <GroupDot group={group} />
          {label}
        </h3>
        <span
          className="rounded-md bg-subtle px-2.5 py-1 font-mono text-sm text-ink-soft tabular-nums"
          aria-live="polite"
          data-testid={`${id}-n`}
        >
          n{sub} = {n}
        </span>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div>
          <label htmlFor={`${id}-name`} className="mb-1.5 block text-sm font-medium text-ink-soft">
            Group name
          </label>
          <input
            id={`${id}-name`}
            type="text"
            value={values.name}
            maxLength={MAX_NAME_LENGTH + 20}
            onChange={(e) => onChange("name", e.target.value)}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? `${id}-name-error` : undefined}
            className={`${inputClass} ${nameError ? "border-danger" : "border-line-strong"}`}
          />
          {nameError && (
            <p id={`${id}-name-error`} className="mt-1.5 text-sm text-danger">
              {nameError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${id}-description`} className="mb-1.5 block text-sm font-medium text-ink-soft">
            Description <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id={`${id}-description`}
            type="text"
            value={values.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="e.g. Quiz scores of students taught by lecture"
            aria-invalid={descriptionError ? true : undefined}
            aria-describedby={descriptionError ? `${id}-description-error` : undefined}
            className={`${inputClass} ${descriptionError ? "border-danger" : "border-line-strong"}`}
          />
          {descriptionError && (
            <p id={`${id}-description-error`} className="mt-1.5 text-sm text-danger">
              {descriptionError} ({values.description.trim().length}/{MAX_DESCRIPTION_LENGTH})
            </p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor={`${id}-values`} className="text-sm font-medium text-ink-soft">
              Observations
            </label>
            <button
              type="button"
              onClick={onClear}
              disabled={values.rawValues === ""}
              className={buttonStyles.ghost}
              aria-label={`Clear ${label} observations`}
            >
              <Eraser className="h-3.5 w-3.5" aria-hidden />
              Clear
            </button>
          </div>
          <textarea
            id={`${id}-values`}
            value={values.rawValues}
            onChange={(e) => onChange("rawValues", e.target.value)}
            rows={6}
            spellCheck={false}
            placeholder={"12, 15, 11, 14\nor one value per line"}
            aria-invalid={valuesError ? true : undefined}
            aria-describedby={`${id}-values-hint${valuesError ? ` ${id}-values-error` : ""}`}
            className={`${inputClass} resize-y font-mono leading-relaxed ${valuesError ? "border-danger" : "border-line-strong"}`}
          />
          <p id={`${id}-values-hint`} className="mt-1.5 text-xs leading-relaxed text-muted">
            Separate values with commas, new lines, or tabs. Decimals use a point (12.5); do not use commas for
            thousands or decimals.
          </p>

          {valuesError && (
            <div id={`${id}-values-error`} role="alert" className="mt-3 rounded-md border border-danger-line bg-danger-soft px-3 py-2.5 text-sm text-danger">
              <p className="font-medium">{valuesError}</p>
              {entryErrors.length > 0 && (
                <ul className="mt-1.5 space-y-1">
                  {entryErrors.slice(0, MAX_LISTED_ERRORS).map((e) => (
                    <li key={`${e.line}-${e.entry}`}>
                      <span className="text-danger/80">Line {e.line}, entry {e.entry}:</span> {e.message}
                    </li>
                  ))}
                  {entryErrors.length > MAX_LISTED_ERRORS && (
                    <li>…and {entryErrors.length - MAX_LISTED_ERRORS} more.</li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
