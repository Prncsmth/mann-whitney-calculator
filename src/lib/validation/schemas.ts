import { z } from "zod";
import { MAX_OBSERVATIONS_PER_GROUP } from "./parse-observations";

export const MAX_NAME_LENGTH = 60;
export const MAX_DESCRIPTION_LENGTH = 200;

/** A single observation. Zod 4 numbers already reject NaN and ±Infinity. */
export const observationSchema = z.number({ error: "Every observation must be a finite number." });

export const observationsSchema = z
  .array(observationSchema)
  .min(1, { error: "Enter at least one numeric observation." })
  .max(MAX_OBSERVATIONS_PER_GROUP, {
    error: `Enter at most ${MAX_OBSERVATIONS_PER_GROUP.toLocaleString("en-US")} observations per group.`,
  });

export const groupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Enter a group name." })
    .max(MAX_NAME_LENGTH, { error: `Group name must be ${MAX_NAME_LENGTH} characters or fewer.` }),
  description: z
    .string()
    .trim()
    .max(MAX_DESCRIPTION_LENGTH, { error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.` })
    .optional(),
  values: observationsSchema,
});

export const alphaSchema = z
  .number({ error: "Significance level must be a number." })
  .gt(0, { error: "Significance level must be greater than 0." })
  .max(0.5, { error: "Significance level must be 0.5 or less. Common values are 0.10, 0.05, and 0.01." });

export const configSchema = z.object({
  alpha: alphaSchema,
  alternative: z.enum(["two-sided", "greater", "less"], { error: "Choose a valid alternative hypothesis." }),
  method: z.enum(["asymptotic", "exact", "automatic"], { error: "Choose a valid p-value method." }),
  continuityCorrection: z.boolean({ error: "Continuity correction must be on or off." }),
});

export const analysisInputSchema = z
  .object({ groupA: groupSchema, groupB: groupSchema })
  .refine((v) => v.groupA.name.toLowerCase() !== v.groupB.name.toLowerCase(), {
    error: "The two groups need different names.",
    path: ["groupB", "name"],
  });
