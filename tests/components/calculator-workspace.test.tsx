// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalculatorWorkspace } from "@/components/calculator/calculator-workspace";
import { analyze, DEFAULT_CONFIG } from "@/lib/statistics/mann-whitney";
import { loadAnalysis, saveAnalysis } from "@/lib/storage/analysis-storage";
import { SAMPLE_INPUT } from "@/constants/sample-data";
import { displayNumber, formatPValue, typographicMinus } from "@/lib/utils/format";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function setup() {
  const user = userEvent.setup();
  render(<CalculatorWorkspace />);
  const textareaA = screen.getByLabelText("Observations", { selector: "#group-a-values" });
  const textareaB = screen.getByLabelText("Observations", { selector: "#group-b-values" });
  const calculate = () => user.click(screen.getByRole("button", { name: "Calculate" }));
  return { user, textareaA, textareaB, calculate };
}

const resultsHeading = () => screen.queryByRole("heading", { name: "Results", level: 2 });

describe("CalculatorWorkspace — input and blocking", () => {
  it("starts with no results and zero sample sizes", () => {
    setup();
    expect(resultsHeading()).toBeNull();
    expect(screen.getByTestId("group-a-n").textContent).toBe("n₁ = 0");
    expect(screen.getByTestId("group-b-n").textContent).toBe("n₂ = 0");
  });

  it("blocks calculation for empty groups and shows inline errors", async () => {
    const { calculate } = setup();
    await calculate();
    expect(screen.getByTestId("calculation-blocked")).toBeTruthy();
    expect(screen.getAllByText("Enter at least one numeric observation.")).toHaveLength(2);
    expect(resultsHeading()).toBeNull();
  });

  it("shows invalid entries immediately and blocks calculation", async () => {
    const { user, textareaA, textareaB, calculate } = setup();
    await user.type(textareaA, "12, abc, 15");
    await user.type(textareaB, "3, 4");
    expect(screen.getByTestId("group-a-n").textContent).toBe("n₁ = 2");
    expect(screen.getByText(/"abc" is not a valid number/)).toBeTruthy();
    expect(screen.getByText("1 entry is not valid. Fix it before calculating.")).toBeTruthy();
    expect(textareaA.getAttribute("aria-invalid")).toBe("true");

    await calculate();
    expect(screen.getByTestId("calculation-blocked")).toBeTruthy();
    expect(resultsHeading()).toBeNull();
  });

  it("rejects NaN and Infinity entries", async () => {
    const { user, textareaA } = setup();
    await user.type(textareaA, "NaN, Infinity");
    expect(screen.getByText(/"NaN" is not a number/)).toBeTruthy();
    expect(screen.getByText(/"Infinity" is not allowed/)).toBeTruthy();
  });

  it("updates sample sizes live with mixed separators", async () => {
    const { user, textareaA } = setup();
    await user.type(textareaA, "1, 2{Enter}3{Enter}{Enter}4,");
    expect(screen.getByTestId("group-a-n").textContent).toBe("n₁ = 4");
  });

  it("clears one group without touching the other", async () => {
    const { user, textareaA, textareaB } = setup();
    await user.click(screen.getByRole("button", { name: "Load Sample Data" }));
    await user.click(screen.getByRole("button", { name: "Clear Group A observations" }));
    expect((textareaA as HTMLTextAreaElement).value).toBe("");
    expect((textareaB as HTMLTextAreaElement).value).toBe("18, 16, 20, 15, 19, 17, 21, 14, 18, 17");
  });

  it("blocks calculation for an invalid custom alpha", async () => {
    const { user, calculate } = setup();
    await user.click(screen.getByRole("button", { name: "Load Sample Data" }));
    await user.click(screen.getByLabelText("Custom"));
    await user.type(screen.getByLabelText(/Custom α/), "0.9");
    expect(screen.getByText(/0.5 or less/)).toBeTruthy();
    await calculate();
    expect(screen.getByTestId("calculation-blocked")).toBeTruthy();
    expect(resultsHeading()).toBeNull();
  });
});

describe("CalculatorWorkspace — sample dataset results", () => {
  const expected = analyze(SAMPLE_INPUT);

  it("loads the sample and displays results that match the statistics engine", async () => {
    const { user, textareaA, calculate } = setup();
    await user.click(screen.getByRole("button", { name: "Load Sample Data" }));
    expect((textareaA as HTMLTextAreaElement).value).toBe("12, 15, 11, 14, 10, 13, 16, 9, 12, 14");
    expect((screen.getByLabelText("Group name", { selector: "#group-a-name" }) as HTMLInputElement).value).toBe(
      "Traditional Lecture",
    );

    await calculate();
    expect(resultsHeading()).toBeTruthy();

    const tiles = within(screen.getByLabelText("Summary statistics"));
    const tile = (label: string | RegExp) => tiles.getByText(label).closest("div")!.querySelector("dd")!.textContent;
    expect(tile("R₁ (rank sum A)")).toBe(displayNumber(expected.u.R1));
    expect(tile("R₂ (rank sum B)")).toBe(displayNumber(expected.u.R2));
    expect(tile("U₁ (U for Group A)")).toBe("5");
    expect(tile("U₂ (U for Group B)")).toBe("95");
    expect(tile("U (smaller U)")).toBe("5");
    expect(tile("p-value")).toBe(formatPValue(expected.pValue!));
    expect(tile("p-value")).toBe("0.00074");

    expect(screen.getByTestId("decision").textContent).toBe("Reject H₀");
    expect(screen.getAllByText(/Normal approximation \(tie-corrected variance, continuity correction\)/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Reference only: conventional tables assume no ties/)).toBeTruthy();
  });

  it("shows all seven steps in order, without tabs", async () => {
    const { user, calculate } = setup();
    await user.click(screen.getByRole("button", { name: "Load Sample Data" }));
    await calculate();
    const titles = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.querySelector("[data-step-title]")?.textContent)
      .filter((t) => t?.startsWith("Step"));
    expect(titles).toEqual([
      "Step 1: State the Null Hypothesis and Alternative Hypothesis",
      "Step 2: State the Level of Significance",
      "Step 3: Write the Data",
      "Step 4: Test Statistic Used",
      "Step 5: Calculate the Test Statistic and Determine the Critical Table Value",
      "Step 6: Make a Decision",
      "Step 7: Conclusion",
    ]);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getByText(/U₁ = R₁ − n₁\(n₁ \+ 1\) \/ 2 = 60 − 10 × 11 \/ 2 = 60 − 55 = 5/)).toBeTruthy();
    // Displayed with a typographic minus; the engine text itself is unchanged.
    expect(screen.getByText(typographicMinus(expected.interpretation.conclusion))).toBeTruthy();
    expect(expected.interpretation.conclusion).toContain("= -0.90");
    expect(screen.getByText(/rank-biserial correlation = −0\.90/)).toBeTruthy();
    // No hyphen-minus before a number anywhere on the page.
    expect(document.body.textContent).not.toMatch(/(^|[\s(=:])-\.?\d/);
  });

  it("uses the exact p-value when Exact permutation is selected", async () => {
    const { user, calculate } = setup();
    await user.click(screen.getByRole("button", { name: "Load Sample Data" }));
    await user.click(screen.getByLabelText(/Exact permutation/));
    await calculate();
    const tiles = within(screen.getByLabelText("Summary statistics"));
    expect(tiles.getByText("p-value").closest("div")!.querySelector("dd")!.textContent).toBe("0.00024");
  });

  it("warns when inputs change after a calculation", async () => {
    const { user, textareaA, calculate } = setup();
    await user.click(screen.getByRole("button", { name: "Load Sample Data" }));
    await calculate();
    expect(screen.queryByText(/have changed since this calculation/)).toBeNull();
    await user.type(textareaA, ", 20");
    expect(screen.getByText(/have changed since this calculation/)).toBeTruthy();
  });

  it("saves only valid analyses for Presentation Mode", async () => {
    const { user, textareaA, calculate } = setup();
    await user.type(textareaA, "1, x");
    await calculate();
    expect(loadAnalysis().status).toBe("empty");

    await user.click(screen.getByRole("button", { name: "Load Sample Data" }));
    await calculate();
    const saved = loadAnalysis();
    expect(saved.status).toBe("ok");
    if (saved.status === "ok") {
      expect(saved.analysis.input.groupA.values).toEqual(SAMPLE_INPUT.groupA.values);
      expect(saved.analysis.config.method).toBe("asymptotic");
    }
  });

  it("restores the last saved analysis when the calculator opens", () => {
    saveAnalysis(SAMPLE_INPUT, { ...DEFAULT_CONFIG, alpha: 0.025, method: "exact" });
    render(<CalculatorWorkspace />);
    expect((screen.getByLabelText("Observations", { selector: "#group-a-values" }) as HTMLTextAreaElement).value).toBe(
      "12, 15, 11, 14, 10, 13, 16, 9, 12, 14",
    );
    expect((screen.getByLabelText(/Custom α/) as HTMLInputElement).value).toBe("0.025");
    expect(screen.getByTestId("decision").textContent).toBe("Reject H₀");
    expect(screen.queryByText(/have changed since this calculation/)).toBeNull();
  });

  it("Reset clears the form and the saved analysis", async () => {
    const { user, calculate } = setup();
    await user.click(screen.getByRole("button", { name: "Load Sample Data" }));
    await calculate();
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(loadAnalysis().status).toBe("empty");
    expect(resultsHeading()).toBeNull();
  });

  it("shows the full hand-calculation in the step-by-step solution", async () => {
    const { user, calculate } = setup();
    await user.click(screen.getByRole("button", { name: "Load Sample Data" }));
    await calculate();

    const solution = document.getElementById("solution")!;
    expect(screen.getByRole("heading", { name: "Step-by-Step Solution", level: 2 })).toBeTruthy();
    // Steps start closed; Show Solution opens all of them.
    await user.click(screen.getByRole("button", { name: "Show Solution" }));
    expect(screen.getAllByRole("button", { expanded: true }).filter((b) => b.getAttribute("aria-controls")?.startsWith("step-"))).toHaveLength(7);

    const text = solution.textContent ?? "";
    // Tie correction: 12 (×2), 14 (×3), 15, 16, 17, 18 (×2 each)
    expect(text).toContain("Score 14: t = 3 → 3³ − 3 = 24");
    expect(text).toContain("Σ(t³ − t) = 6 + 24 + 6 + 6 + 6 + 6 = 54");
    // Variance worked out step by step
    expect(text).toContain("= (100 / 12) × [21 − 54 / (20 × 19)]");
    expect(text).toContain("= 8.3333 × [21 − 0.1421]");
    expect(text).toContain("= 8.3333 × 20.8579");
    expect(text).toContain("= 173.8158");
    // One tail from the normal table, then doubled
    expect(text).toContain("P(Z ≥ 3.3753) = 0.00037");
    expect(text).toContain("p = 2 × P(Z ≥ |z|) = 2 × 0.00037 = 0.00074");
  });

  it("keeps the solution short: steps start closed but each shows its answer in one line", async () => {
    const { user, calculate } = setup();
    await user.click(screen.getByRole("button", { name: "Load Sample Data" }));
    await calculate();

    const stepButtons = () =>
      screen.getAllByRole("button").filter((b) => b.getAttribute("aria-controls")?.startsWith("step-"));
    expect(stepButtons()).toHaveLength(7);
    expect(stepButtons().every((b) => b.getAttribute("aria-expanded") === "false")).toBe(true);
    expect(document.getElementById("step-5-body")!.hidden).toBe(true);

    // One-line answers are visible without opening anything.
    expect(screen.getByText("U = 5 · z = −3.3753 · p = 0.00074 · critical table value = 23")).toBeTruthy();
    expect(screen.getByText("Reject H₀ (p = 0.00074 ≤ α = 0.05)")).toBeTruthy();
    expect(screen.getByText("Significant difference · Gamified Learning scored higher")).toBeTruthy();

    // Clicking a step opens only that step.
    await user.click(stepButtons()[4]);
    expect(document.getElementById("step-5-body")!.hidden).toBe(false);
    expect(document.getElementById("step-1-body")!.hidden).toBe(true);

    // The navigation bar opens a step.
    const nav = within(screen.getByRole("navigation", { name: "Solution steps" }));
    await user.click(nav.getByRole("button", { name: /Decision/ }));
    expect(document.getElementById("step-6-body")!.hidden).toBe(false);

    // Expand all / Collapse all.
    await user.click(screen.getByRole("button", { name: "Expand all steps" }));
    expect(stepButtons().every((b) => b.getAttribute("aria-expanded") === "true")).toBe(true);
    await user.click(screen.getByRole("button", { name: "Collapse all steps" }));
    expect(stepButtons().every((b) => b.getAttribute("aria-expanded") === "false")).toBe(true);
  });

  it("links to Presentation Mode from the results", async () => {
    const { user, calculate } = setup();
    await user.click(screen.getByRole("button", { name: "Load Sample Data" }));
    await calculate();
    expect(screen.getByRole("link", { name: "Start Presentation" }).getAttribute("href")).toBe("/presentation");
  });
});
