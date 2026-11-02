import { describe, expect, it } from "vitest";
import {
  clearAnalysis,
  loadAnalysis,
  parseSavedAnalysis,
  saveAnalysis,
  STORAGE_KEY,
  STORAGE_VERSION,
  type KeyValueStorage,
} from "@/lib/storage/analysis-storage";
import { DEFAULT_CONFIG } from "@/lib/statistics/mann-whitney";
import { SAMPLE_INPUT } from "@/constants/sample-data";

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

const throwingStorage: KeyValueStorage = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
  removeItem: () => {
    throw new Error("SecurityError");
  },
};

const validRecord = () => ({
  version: STORAGE_VERSION,
  savedAt: "2026-11-02T00:00:00.000Z",
  input: SAMPLE_INPUT,
  config: DEFAULT_CONFIG,
});

describe("analysis storage", () => {
  it("round-trips valid inputs and settings with a schema version", () => {
    const storage = memoryStorage();
    expect(saveAnalysis(SAMPLE_INPUT, DEFAULT_CONFIG, storage, new Date("2026-11-02T10:00:00Z"))).toBe(true);
    const loaded = loadAnalysis(storage);
    expect(loaded.status).toBe("ok");
    if (loaded.status === "ok") {
      expect(loaded.analysis.version).toBe(1);
      expect(loaded.analysis.savedAt).toBe("2026-11-02T10:00:00.000Z");
      expect(loaded.analysis.input).toEqual(SAMPLE_INPUT);
      expect(loaded.analysis.config).toEqual(DEFAULT_CONFIG);
    }
  });

  it("stores only inputs and settings — no results, raw text, or extra fields", () => {
    const storage = memoryStorage();
    const inputWithExtras = {
      groupA: { ...SAMPLE_INPUT.groupA, rawValues: "secret text" },
      groupB: { ...SAMPLE_INPUT.groupB, email: "someone@example.com" },
    } as typeof SAMPLE_INPUT;
    saveAnalysis(inputWithExtras, { ...DEFAULT_CONFIG, extra: 1 } as typeof DEFAULT_CONFIG, storage);
    const stored = JSON.parse(storage.data[STORAGE_KEY]);
    expect(Object.keys(stored).sort()).toEqual(["config", "input", "savedAt", "version"]);
    expect(Object.keys(stored.input.groupA).sort()).toEqual(["description", "name", "values"]);
    expect(Object.keys(stored.input.groupB).sort()).toEqual(["description", "name", "values"]);
    expect(Object.keys(stored.config).sort()).toEqual(["alpha", "alternative", "continuityCorrection", "method"]);
    expect(storage.data[STORAGE_KEY]).not.toMatch(/pValue|ranking|secret|example\.com/);
  });

  it("refuses to save invalid data", () => {
    const storage = memoryStorage();
    const bad = { ...SAMPLE_INPUT, groupA: { ...SAMPLE_INPUT.groupA, values: [] } };
    expect(saveAnalysis(bad, DEFAULT_CONFIG, storage)).toBe(false);
    expect(saveAnalysis(SAMPLE_INPUT, { ...DEFAULT_CONFIG, alpha: 2 }, storage)).toBe(false);
    expect(storage.data[STORAGE_KEY]).toBeUndefined();
  });

  it("returns empty when nothing is saved", () => {
    expect(loadAnalysis(memoryStorage())).toEqual({ status: "empty" });
  });

  it("rejects malformed JSON", () => {
    expect(loadAnalysis(memoryStorage({ [STORAGE_KEY]: "{not json" })).status).toBe("invalid");
  });

  it("rejects an unsupported schema version with a specific message", () => {
    const r = parseSavedAnalysis(JSON.stringify({ ...validRecord(), version: 2 }));
    expect(r).toEqual({ status: "invalid", reason: "The saved analysis was created by a different version of this app." });
  });

  it.each([
    ["missing version", (r: Record<string, unknown>) => { delete r.version; }],
    ["empty group", (r: ReturnType<typeof validRecord>) => { r.input = { ...r.input, groupB: { ...r.input.groupB, values: [] } }; }],
    ["NaN serialized as null", (r: ReturnType<typeof validRecord>) => { r.input = { ...r.input, groupA: { ...r.input.groupA, values: [1, null as unknown as number] } }; }],
    ["string values", (r: ReturnType<typeof validRecord>) => { r.input = { ...r.input, groupA: { ...r.input.groupA, values: ["12"] as unknown as number[] } }; }],
    ["invalid alpha", (r: ReturnType<typeof validRecord>) => { r.config = { ...r.config, alpha: 0 }; }],
    ["unknown method", (r: ReturnType<typeof validRecord>) => { r.config = { ...r.config, method: "magic" as "exact" }; }],
    ["duplicate group names", (r: ReturnType<typeof validRecord>) => { r.input = { ...r.input, groupB: { ...r.input.groupB, name: r.input.groupA.name } }; }],
  ])("rejects tampered data: %s", (_, mutate) => {
    const record = validRecord();
    mutate(record as never);
    const r = parseSavedAnalysis(JSON.stringify(record));
    expect(r.status).toBe("invalid");
  });

  it.each(["null", "42", '"text"', "[]"])("rejects non-object JSON %s", (raw) => {
    expect(parseSavedAnalysis(raw).status).toBe("invalid");
  });

  it("handles unavailable storage without throwing", () => {
    expect(loadAnalysis(null)).toEqual({ status: "unavailable" });
    expect(loadAnalysis(throwingStorage)).toEqual({ status: "unavailable" });
    expect(saveAnalysis(SAMPLE_INPUT, DEFAULT_CONFIG, throwingStorage)).toBe(false);
    expect(saveAnalysis(SAMPLE_INPUT, DEFAULT_CONFIG, null)).toBe(false);
    expect(() => clearAnalysis(throwingStorage)).not.toThrow();
  });

  it("clears the saved analysis", () => {
    const storage = memoryStorage();
    saveAnalysis(SAMPLE_INPUT, DEFAULT_CONFIG, storage);
    clearAnalysis(storage);
    expect(loadAnalysis(storage)).toEqual({ status: "empty" });
  });
});
