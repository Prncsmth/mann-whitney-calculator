// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CriticalValuesTable } from "@/components/critical-values/critical-values-table";
import { buildAllCriticalValueTables } from "@/lib/statistics/critical-value-table";
import { saveAnalysis } from "@/lib/storage/analysis-storage";
import { DEFAULT_CONFIG } from "@/lib/statistics/mann-whitney";
import { SAMPLE_INPUT } from "@/constants/sample-data";

const TABLES = buildAllCriticalValueTables();

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("CriticalValuesTable", () => {
  it("shows the two-tailed α = 0.05 table first", () => {
    render(<CriticalValuesTable tables={TABLES} />);
    expect(screen.getByRole("heading", { name: "Two-tailed, α = 0.05" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Two-tailed, α = 0.05" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("switches tables", async () => {
    const user = userEvent.setup();
    render(<CriticalValuesTable tables={TABLES} />);
    await user.click(screen.getByRole("button", { name: "Two-tailed, α = 0.01" }));
    expect(screen.getByRole("heading", { name: "Two-tailed, α = 0.01" })).toBeTruthy();
  });

  it("highlights the cell for the last saved analysis (n₁ = n₂ = 10 → 23)", () => {
    saveAnalysis(SAMPLE_INPUT, DEFAULT_CONFIG);
    render(<CriticalValuesTable tables={TABLES} />);
    const cell = screen.getByTestId("critical-table").querySelector("[data-highlighted]");
    expect(cell?.textContent).toBe("23");
    expect(screen.getByText(/Your last analysis: n₁ = 10, n₂ = 10/)).toBeTruthy();
  });

  it("highlights nothing when there is no saved analysis", () => {
    render(<CriticalValuesTable tables={TABLES} />);
    expect(screen.getByTestId("critical-table").querySelector("[data-highlighted]")).toBeNull();
  });
});
