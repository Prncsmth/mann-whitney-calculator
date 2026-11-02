/**
 * Turns the text typed into a group's textarea into numbers.
 *
 * Accepted separators: commas, new lines, and tabs (tabs appear when a row is
 * pasted from a spreadsheet). Blank entries (",,", trailing commas, empty lines)
 * are ignored. Each entry must be a single plain number: integer, decimal, or
 * negative, e.g. 12, -3.5, .75, 1e3.
 *
 * Every invalid entry is reported with its line and position so the user can
 * find it. Nothing is silently dropped except blank entries.
 */

export const MAX_OBSERVATIONS_PER_GROUP = 10_000;

export interface ObservationError {
  /** The entry exactly as typed (trimmed). */
  token: string;
  /** 1-based line number in the textarea. */
  line: number;
  /** 1-based position of the entry among all non-blank entries. */
  entry: number;
  message: string;
}

export interface ParseResult {
  values: number[];
  errors: ObservationError[];
}

// Optional sign, digits with optional decimal part (or a leading-dot decimal), optional exponent.
const NUMBER_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

/** Characters that look like a minus sign when copied from documents or slides. */
const MINUS_LOOKALIKES = /[−‒–—﹣－]/g;

function describeProblem(token: string): string {
  const lower = token.toLowerCase();
  if (lower === "nan") return `"${token}" is not a number.`;
  if (/^[+-]?(inf|infinity|∞)$/.test(lower)) return `"${token}" is not allowed. Values must be finite numbers.`;
  if (/^[+-]?\d+(\.\d+)?\s+[+-]?\d+(\.\d+)?/.test(token)) {
    return `"${token}" contains a space between numbers. Separate values with commas or new lines.`;
  }
  if (/^[+-]?\d+(?:\.\d+)?\s*%$/.test(token)) return `"${token}" contains a % sign. Enter the number only.`;
  if (/^\d+\.\d+\.\d+/.test(token)) return `"${token}" has more than one decimal point.`;
  return `"${token}" is not a valid number. Use digits, an optional minus sign, and a decimal point.`;
}

export function parseObservations(text: string): ParseResult {
  const values: number[] = [];
  const errors: ObservationError[] = [];
  let entry = 0;

  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  lines.forEach((lineText, lineIndex) => {
    for (const raw of lineText.split(/[,\t]/)) {
      const token = raw.trim();
      if (token === "") continue; // blank entry
      entry++;
      const normalized = token.replace(MINUS_LOOKALIKES, "-");
      const error = (message: string) => errors.push({ token, line: lineIndex + 1, entry, message });

      if (!NUMBER_PATTERN.test(normalized)) {
        error(describeProblem(token));
        continue;
      }
      const value = Number(normalized);
      if (!Number.isFinite(value)) {
        error(`"${token}" is too large to use as a number.`);
        continue;
      }
      values.push(Object.is(value, -0) ? 0 : value);
    }
  });

  return { values, errors };
}

/** Converts numbers back into textarea text (one comma-separated line). */
export function formatObservations(values: readonly number[]): string {
  return values.join(", ");
}
