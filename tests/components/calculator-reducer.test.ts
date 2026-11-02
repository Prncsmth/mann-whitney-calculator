import { describe, expect, it } from "vitest";
import { calculatorReducer, INITIAL_STATE, toFormValues } from "@/hooks/use-calculator";

describe("calculatorReducer", () => {
  it("does not produce a result when input is invalid", () => {
    const s = calculatorReducer(INITIAL_STATE, { type: "calculate" });
    expect(s.attempted).toBe(true);
    expect(s.result).toBeNull();
  });

  it("keeps the previous result (marked stale by the hook) when a later attempt is invalid", () => {
    let s = calculatorReducer(INITIAL_STATE, { type: "loadSample" });
    s = calculatorReducer(s, { type: "calculate" });
    const first = s.result;
    expect(first).not.toBeNull();
    s = calculatorReducer(s, { type: "setGroupField", group: "groupA", field: "rawValues", value: "abc" });
    s = calculatorReducer(s, { type: "calculate" });
    expect(s.result).toBe(first);
    expect(s.resultKey).not.toBe(JSON.stringify(toFormValues(s)));
  });

  it("loads the sample with the approved default configuration", () => {
    const s = calculatorReducer({ ...INITIAL_STATE, method: "exact", alphaChoice: "0.01" }, { type: "loadSample" });
    expect(toFormValues(s).config).toEqual({ alpha: 0.05, alternative: "two-sided", method: "asymptotic", continuityCorrection: true });
    expect(s.groups.groupB.name).toBe("Gamified Learning");
  });

  it("maps the custom alpha text to a number, or NaN when blank", () => {
    let s = calculatorReducer(INITIAL_STATE, { type: "setAlphaChoice", value: "custom" });
    expect(Number.isNaN(toFormValues(s).config.alpha)).toBe(true);
    s = calculatorReducer(s, { type: "setCustomAlpha", value: " 0.025 " });
    expect(toFormValues(s).config.alpha).toBe(0.025);
  });
});
