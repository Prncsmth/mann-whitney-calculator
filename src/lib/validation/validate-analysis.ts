import type { AnalysisConfig, AnalysisInput, MannWhitneyResult } from "@/types/statistics";
import { analyze } from "@/lib/statistics/mann-whitney";
import { parseObservations, type ObservationError } from "./parse-observations";
import { analysisInputSchema, configSchema } from "./schemas";

/** Raw form state, exactly as typed by the user. */
export interface GroupFormValues {
  name: string;
  description: string;
  /** Textarea contents. */
  rawValues: string;
}

export interface AnalysisFormValues {
  groupA: GroupFormValues;
  groupB: GroupFormValues;
  config: AnalysisConfig;
}

export interface GroupValidation {
  /** Valid numbers found so far (shown as the live sample size). */
  values: number[];
  /** Problems with individual entries in the textarea. */
  entryErrors: ObservationError[];
  /** Problems with the group as a whole (empty group, name, description). */
  fieldErrors: { name?: string; description?: string; values?: string };
}

export type ValidationResult =
  | { success: true; input: AnalysisInput; config: AnalysisConfig; groupA: GroupValidation; groupB: GroupValidation }
  | {
      success: false;
      groupA: GroupValidation;
      groupB: GroupValidation;
      configErrors: Partial<Record<keyof AnalysisConfig, string>>;
      formErrors: string[];
    };

const DEFAULT_NAMES = { groupA: "Group A", groupB: "Group B" } as const;

/**
 * Validates the whole form. The parsed numbers go through Zod again, so the
 * engine only ever receives data that passed both checks.
 */
export function validateAnalysisForm(form: AnalysisFormValues): ValidationResult {
  const groups = {} as Record<"groupA" | "groupB", GroupValidation>;
  const candidate = {} as Record<"groupA" | "groupB", { name: string; description?: string; values: number[] }>;

  for (const key of ["groupA", "groupB"] as const) {
    const g = form[key];
    const { values, errors } = parseObservations(g.rawValues);
    groups[key] = { values, entryErrors: errors, fieldErrors: {} };
    const description = g.description.trim();
    candidate[key] = {
      name: g.name.trim() || DEFAULT_NAMES[key], // blank name → "Group A" / "Group B"
      description: description === "" ? undefined : description,
      values,
    };
  }

  const formErrors: string[] = [];
  const parsedInput = analysisInputSchema.safeParse(candidate);
  if (!parsedInput.success) {
    for (const issue of parsedInput.error.issues) {
      const [group, field] = issue.path as ["groupA" | "groupB", "name" | "description" | "values", ...unknown[]];
      if ((group === "groupA" || group === "groupB") && field) {
        groups[group].fieldErrors[field] ??= issue.message;
      } else {
        formErrors.push(issue.message);
      }
    }
  }

  const configErrors: Partial<Record<keyof AnalysisConfig, string>> = {};
  const parsedConfig = configSchema.safeParse(form.config);
  if (!parsedConfig.success) {
    for (const issue of parsedConfig.error.issues) {
      const field = issue.path[0] as keyof AnalysisConfig;
      configErrors[field] ??= issue.message;
    }
  }

  // Invalid entries block calculation even when other entries are valid numbers.
  for (const key of ["groupA", "groupB"] as const) {
    const n = groups[key].entryErrors.length;
    if (n > 0 && !groups[key].fieldErrors.values) {
      groups[key].fieldErrors.values = `${n} ${n === 1 ? "entry is" : "entries are"} not valid. Fix ${n === 1 ? "it" : "them"} before calculating.`;
    }
  }

  const hasEntryErrors = groups.groupA.entryErrors.length > 0 || groups.groupB.entryErrors.length > 0;
  if (!parsedInput.success || !parsedConfig.success || hasEntryErrors) {
    return { success: false, groupA: groups.groupA, groupB: groups.groupB, configErrors, formErrors };
  }
  return { success: true, input: parsedInput.data, config: parsedConfig.data, groupA: groups.groupA, groupB: groups.groupB };
}

export type ValidatedAnalysis =
  | { ok: true; result: MannWhitneyResult; validation: Extract<ValidationResult, { success: true }> }
  | { ok: false; validation: Extract<ValidationResult, { success: false }> };

/**
 * The only path the UI uses to run a calculation.
 * The statistical engine is never called when validation fails.
 */
export function runValidatedAnalysis(
  form: AnalysisFormValues,
  engine: typeof analyze = analyze,
): ValidatedAnalysis {
  const validation = validateAnalysisForm(form);
  if (!validation.success) return { ok: false, validation };
  return { ok: true, result: engine(validation.input, validation.config), validation };
}
