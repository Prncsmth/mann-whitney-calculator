import { describe, expect, it } from "vitest";
import { formatObservations, parseObservations } from "@/lib/validation/parse-observations";

const values = (text: string) => parseObservations(text).values;
const errorTokens = (text: string) => parseObservations(text).errors.map((e) => e.token);

describe("parseObservations — separators and whitespace", () => {
  it("parses comma-separated values", () => {
    expect(values("12, 15, 11, 14")).toEqual([12, 15, 11, 14]);
  });

  it("parses newline-separated values (LF, CRLF and CR)", () => {
    expect(values("12\n15\n11")).toEqual([12, 15, 11]);
    expect(values("12\r\n15\r\n11")).toEqual([12, 15, 11]);
    expect(values("12\r15")).toEqual([12, 15]);
  });

  it("parses mixed commas and new lines", () => {
    expect(values("12, 15\n11,14\n\n10 ,13")).toEqual([12, 15, 11, 14, 10, 13]);
  });

  it("parses tab-separated values pasted from a spreadsheet row", () => {
    expect(values("12\t15\t11")).toEqual([12, 15, 11]);
  });

  it("trims spaces and tabs around entries", () => {
    expect(values("   12  ,\t 15 \n  11   ")).toEqual([12, 15, 11]);
  });

  it("ignores blank entries: double commas, trailing commas, empty lines", () => {
    const r = parseObservations(",12,,15,\n\n,\n11,");
    expect(r.values).toEqual([12, 15, 11]);
    expect(r.errors).toEqual([]);
  });

  it("returns no values and no errors for empty or whitespace-only text", () => {
    expect(parseObservations("")).toEqual({ values: [], errors: [] });
    expect(parseObservations("  \n , \t ,\n")).toEqual({ values: [], errors: [] });
  });
});

describe("parseObservations — number formats", () => {
  it("keeps duplicate values (ties are valid data)", () => {
    expect(values("12, 12, 12, 14")).toEqual([12, 12, 12, 14]);
  });

  it("parses decimals, including leading and trailing dots", () => {
    expect(values("1.5, 0.25, .75, 3., -0.125")).toEqual([1.5, 0.25, 0.75, 3, -0.125]);
  });

  it("parses negative values and an explicit plus sign", () => {
    expect(values("-3, -0.5, +4, -10")).toEqual([-3, -0.5, 4, -10]);
  });

  it("accepts a typographic minus sign copied from documents", () => {
    expect(values("−3, –2.5")).toEqual([-3, -2.5]);
  });

  it("parses scientific notation", () => {
    expect(values("1e3, 2.5E-2, -4e+1")).toEqual([1000, 0.025, -40]);
  });

  it("normalizes -0 to 0", () => {
    expect(Object.is(values("-0")[0], 0)).toBe(true);
  });
});

describe("parseObservations — invalid entries", () => {
  it("rejects letters and mixed tokens, keeping the valid ones", () => {
    const r = parseObservations("12, abc, 15, 12a, x7");
    expect(r.values).toEqual([12, 15]);
    expect(r.errors.map((e) => e.token)).toEqual(["abc", "12a", "x7"]);
  });

  it.each([
    ["NaN", /not a number/],
    ["nan", /not a number/],
    ["Infinity", /finite/],
    ["-Infinity", /finite/],
    ["inf", /finite/],
    ["∞", /finite/],
  ])("rejects %s with a clear message", (token, message) => {
    const r = parseObservations(`1, ${token}, 2`);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0].message).toMatch(message);
  });

  it("rejects numbers too large to represent", () => {
    const r = parseObservations("1e400");
    expect(r.values).toEqual([]);
    expect(r.errors[0].message).toMatch(/too large/);
  });

  it.each([
    ["12 15", /space between numbers/],
    ["12.5.3", /more than one decimal point/],
    ["45%", /% sign/],
    ["$12", /not a valid number/],
    ["1/2", /not a valid number/],
    ["--5", /not a valid number/],
    ["-", /not a valid number/],
    [".", /not a valid number/],
    ["1e", /not a valid number/],
    ["0x1F", /not a valid number/],
  ])("rejects %s", (token, message) => {
    const r = parseObservations(token);
    expect(r.values).toEqual([]);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0].message).toMatch(message);
  });

  it("rejects semicolons as separators instead of guessing", () => {
    expect(errorTokens("12; 15")).toEqual(["12; 15"]);
  });

  it("reports the line and entry position of each error", () => {
    const r = parseObservations("12, 15\n\nabc, 11\n14, ??");
    expect(r.errors).toEqual([
      expect.objectContaining({ token: "abc", line: 3, entry: 3 }),
      expect.objectContaining({ token: "??", line: 4, entry: 6 }),
    ]);
  });
});

describe("formatObservations", () => {
  it("round-trips through parseObservations", () => {
    const original = [12, -3.5, 0.25, 1000, 12];
    expect(values(formatObservations(original))).toEqual(original);
  });
});
