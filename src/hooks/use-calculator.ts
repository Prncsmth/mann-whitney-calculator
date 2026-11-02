"use client";

import { useMemo, useReducer } from "react";
import type { AnalysisConfig, AnalysisInput, Alternative, MannWhitneyResult, PValueMethod } from "@/types/statistics";
import { DEFAULT_CONFIG } from "@/lib/statistics/mann-whitney";
import { SAMPLE_INPUT } from "@/constants/sample-data";
import { formatObservations } from "@/lib/validation/parse-observations";
import {
  runValidatedAnalysis,
  validateAnalysisForm,
  type AnalysisFormValues,
  type GroupFormValues,
} from "@/lib/validation/validate-analysis";

export type GroupKey = "groupA" | "groupB";
export type AlphaChoice = "0.1" | "0.05" | "0.01" | "custom";

export interface CalculatorState {
  groups: Record<GroupKey, GroupFormValues>;
  alphaChoice: AlphaChoice;
  customAlpha: string;
  alternative: Alternative;
  method: PValueMethod;
  continuityCorrection: boolean;
  /** True after the user pressed Calculate at least once (shows "empty group" errors). */
  attempted: boolean;
  result: MannWhitneyResult | null;
  /** Serialized form that produced `result`, to detect later edits. */
  resultKey: string | null;
}

export type CalculatorAction =
  | { type: "setGroupField"; group: GroupKey; field: keyof GroupFormValues; value: string }
  | { type: "clearGroup"; group: GroupKey }
  | { type: "loadSample" }
  | { type: "reset" }
  | { type: "setAlphaChoice"; value: AlphaChoice }
  | { type: "setCustomAlpha"; value: string }
  | { type: "setAlternative"; value: Alternative }
  | { type: "setMethod"; value: PValueMethod }
  | { type: "setContinuityCorrection"; value: boolean }
  | { type: "calculate" }
  | { type: "restore"; input: AnalysisInput; config: AnalysisConfig };

const emptyGroup = (): GroupFormValues => ({ name: "", description: "", rawValues: "" });

export const INITIAL_STATE: CalculatorState = {
  groups: { groupA: { ...emptyGroup(), name: "Group A" }, groupB: { ...emptyGroup(), name: "Group B" } },
  alphaChoice: "0.05",
  customAlpha: "",
  alternative: DEFAULT_CONFIG.alternative,
  method: DEFAULT_CONFIG.method,
  continuityCorrection: DEFAULT_CONFIG.continuityCorrection,
  attempted: false,
  result: null,
  resultKey: null,
};

function alphaValue(state: CalculatorState): number {
  if (state.alphaChoice !== "custom") return Number(state.alphaChoice);
  const text = state.customAlpha.trim();
  return text === "" ? Number.NaN : Number(text);
}

export function toFormValues(state: CalculatorState): AnalysisFormValues {
  return {
    groupA: state.groups.groupA,
    groupB: state.groups.groupB,
    config: {
      alpha: alphaValue(state),
      alternative: state.alternative,
      method: state.method,
      continuityCorrection: state.continuityCorrection,
    },
  };
}

const formKey = (state: CalculatorState) => JSON.stringify(toFormValues(state));

export function calculatorReducer(state: CalculatorState, action: CalculatorAction): CalculatorState {
  switch (action.type) {
    case "setGroupField":
      return {
        ...state,
        groups: { ...state.groups, [action.group]: { ...state.groups[action.group], [action.field]: action.value } },
      };
    case "clearGroup":
      return { ...state, groups: { ...state.groups, [action.group]: { ...state.groups[action.group], rawValues: "" } } };
    case "loadSample":
      return {
        ...INITIAL_STATE,
        groups: {
          groupA: {
            name: SAMPLE_INPUT.groupA.name,
            description: SAMPLE_INPUT.groupA.description ?? "",
            rawValues: formatObservations(SAMPLE_INPUT.groupA.values),
          },
          groupB: {
            name: SAMPLE_INPUT.groupB.name,
            description: SAMPLE_INPUT.groupB.description ?? "",
            rawValues: formatObservations(SAMPLE_INPUT.groupB.values),
          },
        },
      };
    case "reset":
      return INITIAL_STATE;
    case "setAlphaChoice":
      return { ...state, alphaChoice: action.value };
    case "setCustomAlpha":
      return { ...state, customAlpha: action.value };
    case "setAlternative":
      return { ...state, alternative: action.value };
    case "setMethod":
      return { ...state, method: action.value };
    case "setContinuityCorrection":
      return { ...state, continuityCorrection: action.value };
    case "calculate": {
      // The engine only runs inside runValidatedAnalysis, after validation passes.
      const outcome = runValidatedAnalysis(toFormValues(state));
      if (!outcome.ok) return { ...state, attempted: true };
      return { ...state, attempted: true, result: outcome.result, resultKey: formKey(state) };
    }
    case "restore": {
      // Refill the form from a saved analysis, then recalculate through the normal validated path.
      const toGroup = (g: AnalysisInput["groupA"]): GroupFormValues => ({
        name: g.name,
        description: g.description ?? "",
        rawValues: formatObservations(g.values),
      });
      const preset = PRESET_ALPHAS.find((a) => Number(a) === action.config.alpha);
      const filled: CalculatorState = {
        ...INITIAL_STATE,
        groups: { groupA: toGroup(action.input.groupA), groupB: toGroup(action.input.groupB) },
        alphaChoice: preset ?? "custom",
        customAlpha: preset ? "" : String(action.config.alpha),
        alternative: action.config.alternative,
        method: action.config.method,
        continuityCorrection: action.config.continuityCorrection,
      };
      const restored = calculatorReducer(filled, { type: "calculate" });
      return restored.result ? restored : INITIAL_STATE;
    }
  }
}

const PRESET_ALPHAS = ["0.1", "0.05", "0.01"] as const;

export function useCalculator(initial: CalculatorState = INITIAL_STATE) {
  const [state, dispatch] = useReducer(calculatorReducer, initial);
  const validation = useMemo(() => validateAnalysisForm(toFormValues(state)), [state]);
  const isStale = state.result !== null && state.resultKey !== formKey(state);
  return { state, dispatch, validation, isStale };
}
