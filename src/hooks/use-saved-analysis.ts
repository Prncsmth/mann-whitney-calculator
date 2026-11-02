"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { MannWhitneyResult } from "@/types/statistics";
import { analyze } from "@/lib/statistics/mann-whitney";
import {
  parseSavedAnalysis,
  readAnalysisSnapshot,
  STORAGE_UNAVAILABLE,
  subscribeToAnalysis,
  type SavedAnalysis,
} from "@/lib/storage/analysis-storage";

export type SavedAnalysisState =
  | { status: "loading" }
  | { status: "ready"; saved: SavedAnalysis; result: MannWhitneyResult }
  | { status: "empty" }
  | { status: "invalid"; reason: string }
  | { status: "unavailable" };

const serverSnapshot = () => undefined;

/**
 * The latest saved analysis, recomputed with the statistical engine.
 * Updates automatically when the calculator saves a new analysis (also from another tab).
 */
export function useSavedAnalysis(): SavedAnalysisState {
  const raw = useSyncExternalStore(subscribeToAnalysis, readAnalysisSnapshot, serverSnapshot);

  return useMemo<SavedAnalysisState>(() => {
    if (raw === undefined) return { status: "loading" };
    if (raw === STORAGE_UNAVAILABLE) return { status: "unavailable" };
    const loaded = parseSavedAnalysis(raw);
    if (loaded.status !== "ok") return loaded;
    try {
      return { status: "ready", saved: loaded.analysis, result: analyze(loaded.analysis.input, loaded.analysis.config) };
    } catch {
      return { status: "invalid", reason: "The saved analysis could not be recalculated." };
    }
  }, [raw]);
}
