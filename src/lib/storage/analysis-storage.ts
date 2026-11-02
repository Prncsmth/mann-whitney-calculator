import { z } from "zod";
import type { AnalysisConfig, AnalysisInput } from "@/types/statistics";
import { analysisInputSchema, configSchema } from "@/lib/validation/schemas";

/**
 * Saves the latest VALID calculator inputs and settings in localStorage so
 * Presentation Mode can recompute the same analysis.
 *
 * Only the parsed numbers, group names/descriptions, and test settings are
 * stored, never results. Results are always recomputed with the statistical
 * engine, so they can never be stale or edited by hand.
 */

export const STORAGE_KEY = "mann-whitney-calculator:analysis";
export const STORAGE_VERSION = 1;

/** Minimal Storage interface, so tests can pass a fake. */
export type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface SavedAnalysis {
  version: typeof STORAGE_VERSION;
  savedAt: string;
  input: AnalysisInput;
  config: AnalysisConfig;
}

const savedAnalysisSchema = z.object({
  version: z.literal(STORAGE_VERSION),
  savedAt: z.string(),
  input: analysisInputSchema,
  config: configSchema,
});

export type LoadResult =
  | { status: "ok"; analysis: SavedAnalysis }
  | { status: "empty" }
  | { status: "invalid"; reason: string }
  | { status: "unavailable" };

function defaultStorage(): KeyValueStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // access can throw when storage is blocked
  }
}

/** Parses a raw stored string. Exported so components can re-check the same string they read. */
export function parseSavedAnalysis(raw: string | null): LoadResult {
  if (raw === null) return { status: "empty" };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { status: "invalid", reason: "The saved analysis could not be read." };
  }
  if (data && typeof data === "object" && "version" in data && data.version !== STORAGE_VERSION) {
    return { status: "invalid", reason: "The saved analysis was created by a different version of this app." };
  }
  const parsed = savedAnalysisSchema.safeParse(data);
  if (!parsed.success) return { status: "invalid", reason: "The saved analysis is incomplete or contains invalid values." };
  return { status: "ok", analysis: parsed.data as SavedAnalysis };
}

export function loadAnalysis(storage: KeyValueStorage | null = defaultStorage()): LoadResult {
  if (!storage) return { status: "unavailable" };
  try {
    return parseSavedAnalysis(storage.getItem(STORAGE_KEY));
  } catch {
    return { status: "unavailable" };
  }
}

/** Saves inputs + settings. Returns false if storage is unavailable or the data is invalid. */
export function saveAnalysis(
  input: AnalysisInput,
  config: AnalysisConfig,
  storage: KeyValueStorage | null = defaultStorage(),
  now: Date = new Date(),
): boolean {
  if (!storage) return false;
  const record = {
    version: STORAGE_VERSION,
    savedAt: now.toISOString(),
    // Copy only the fields we need; nothing else from the form is stored.
    input: {
      groupA: { name: input.groupA.name, description: input.groupA.description, values: [...input.groupA.values] },
      groupB: { name: input.groupB.name, description: input.groupB.description, values: [...input.groupB.values] },
    },
    config: {
      alpha: config.alpha,
      alternative: config.alternative,
      method: config.method,
      continuityCorrection: config.continuityCorrection,
    },
  };
  if (!savedAnalysisSchema.safeParse(record).success) return false; // never save invalid data
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(record));
    notifySameTab();
    return true;
  } catch {
    return false; // quota exceeded or storage blocked
  }
}

export function clearAnalysis(storage: KeyValueStorage | null = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
    notifySameTab();
  } catch {
    // ignore: nothing to clear if storage is blocked
  }
}

/* ---------- Subscription helpers for React's useSyncExternalStore ---------- */

const SAME_TAB_EVENT = "mann-whitney-calculator:storage";

function notifySameTab() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SAME_TAB_EVENT));
}

/** Calls `callback` when the saved analysis changes in this tab or another tab. */
export function subscribeToAnalysis(callback: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(SAME_TAB_EVENT, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(SAME_TAB_EVENT, callback);
  };
}

/** Sentinel snapshot meaning "storage cannot be read". */
export const STORAGE_UNAVAILABLE = "\u0000unavailable";

/** Raw snapshot (a string, so React can compare snapshots cheaply). */
export function readAnalysisSnapshot(): string | null {
  const storage = defaultStorage();
  if (!storage) return STORAGE_UNAVAILABLE;
  try {
    return storage.getItem(STORAGE_KEY);
  } catch {
    return STORAGE_UNAVAILABLE;
  }
}
