// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PresentationDeck } from "@/components/presentation/presentation-deck";
import { saveAnalysis, STORAGE_KEY } from "@/lib/storage/analysis-storage";
import { DEFAULT_CONFIG } from "@/lib/statistics/mann-whitney";
import { SAMPLE_INPUT, SAMPLE_RESEARCH_PROBLEM } from "@/constants/sample-data";

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
  window.sessionStorage.clear();
});

const counter = () => screen.getByTestId("slide-counter").textContent;
const slideText = () => screen.getByTestId("slide").textContent ?? "";
const key = (k: string) => fireEvent.keyDown(window, { key: k });

function renderWithSample(config = DEFAULT_CONFIG) {
  saveAnalysis(SAMPLE_INPUT, config);
  return render(<PresentationDeck />);
}

describe("PresentationDeck — saved data states", () => {
  it("explains what to do when there is no saved analysis", () => {
    render(<PresentationDeck />);
    expect(screen.getByText("No saved analysis yet")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open Calculator" }).getAttribute("href")).toBe("/calculator");
    expect(screen.queryByTestId("slide")).toBeNull();
  });

  it("does not show slides for malformed saved data", () => {
    window.localStorage.setItem(STORAGE_KEY, "{broken");
    render(<PresentationDeck />);
    expect(screen.getByText("Saved analysis cannot be used")).toBeTruthy();
    expect(screen.queryByTestId("slide")).toBeNull();
  });

  it("does not show slides for an unsupported version", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, savedAt: "", input: SAMPLE_INPUT, config: DEFAULT_CONFIG }));
    render(<PresentationDeck />);
    expect(screen.getByText(/different version of this app/)).toBeTruthy();
  });

  it("does not show slides when saved values are invalid", () => {
    const bad = { version: 1, savedAt: "", input: { ...SAMPLE_INPUT, groupA: { ...SAMPLE_INPUT.groupA, values: [] } }, config: DEFAULT_CONFIG };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bad));
    render(<PresentationDeck />);
    expect(screen.getByText("Saved analysis cannot be used")).toBeTruthy();
  });

  it("updates when the calculator saves a new analysis", () => {
    render(<PresentationDeck />);
    expect(screen.getByText("No saved analysis yet")).toBeTruthy();
    act(() => {
      saveAnalysis(SAMPLE_INPUT, DEFAULT_CONFIG);
    });
    expect(counter()).toBe("1 / 8");
  });
});

describe("PresentationDeck — navigation", () => {
  it("starts on slide 1 with Previous disabled", () => {
    renderWithSample();
    expect(counter()).toBe("1 / 8");
    expect((screen.getByRole("button", { name: "Previous slide" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("region", { name: "Slide 1 of 8: Mann–Whitney U Test" })).toBeTruthy();
  });

  it("moves with the Next and Previous buttons", async () => {
    const user = userEvent.setup();
    renderWithSample();
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(counter()).toBe("3 / 8");
    await user.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(counter()).toBe("2 / 8");
  });

  it("supports arrow keys, Space, PageUp/PageDown, Home and End", () => {
    renderWithSample();
    key("ArrowRight");
    expect(counter()).toBe("2 / 8");
    key(" ");
    key("PageDown");
    expect(counter()).toBe("4 / 8");
    key("ArrowLeft");
    key("PageUp");
    expect(counter()).toBe("2 / 8");
    key("End");
    expect(counter()).toBe("8 / 8");
    key("Home");
    expect(counter()).toBe("1 / 8");
  });

  it("stays within the first and last slide", () => {
    renderWithSample();
    key("ArrowLeft");
    expect(counter()).toBe("1 / 8");
    for (let i = 0; i < 12; i++) key("ArrowRight");
    expect(counter()).toBe("8 / 8");
    expect((screen.getByRole("button", { name: "Next slide" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("ignores navigation keys with modifier keys", () => {
    renderWithSample();
    fireEvent.keyDown(window, { key: "ArrowRight", ctrlKey: true });
    fireEvent.keyDown(window, { key: "ArrowRight", altKey: true });
    expect(counter()).toBe("1 / 8");
  });

  it("jumps to a slide from the progress indicator", async () => {
    const user = userEvent.setup();
    renderWithSample();
    await user.click(screen.getByRole("button", { name: "Go to slide 6: Computation" }));
    expect(counter()).toBe("6 / 8");
    expect(screen.getByRole("button", { name: "Go to slide 6: Computation" }).getAttribute("aria-current")).toBe("step");
  });

  it("does not change slides while typing presenter details", async () => {
    const user = userEvent.setup();
    renderWithSample();
    const name = screen.getByPlaceholderText("Add your name");
    await user.type(name, "Juan Dela Cruz ");
    fireEvent.keyDown(name, { key: "ArrowRight" });
    expect(counter()).toBe("1 / 8");
    expect((name as HTMLInputElement).value).toBe("Juan Dela Cruz ");
    // Kept for this tab only (sessionStorage), not in localStorage.
    expect(window.sessionStorage.getItem("mann-whitney-calculator:presenter")).toContain("Juan Dela Cruz");
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toContain("Juan");
  });

  it("has an Exit Presentation link back to the calculator", () => {
    renderWithSample();
    expect(screen.getByRole("link", { name: /Exit/ }).getAttribute("href")).toBe("/calculator");
  });
});

describe("PresentationDeck — approved sample content on all 8 slides", () => {
  function slides(): string[] {
    renderWithSample();
    const texts: string[] = [];
    for (let i = 0; i < 8; i++) {
      texts.push(slideText());
      key("ArrowRight");
    }
    return texts;
  }

  it("shows the approved content and values", () => {
    const [s1, s2, s3, s4, s5, s6, s7, s8] = slides();

    expect(s1).toContain("Mann–Whitney U Test");
    expect(s1).toContain("Traditional Lecture");
    expect(s1).toContain("Gamified Learning");

    expect(s2).toContain(SAMPLE_RESEARCH_PROBLEM);
    expect(s2).toContain("12, 15, 11, 14, 10, 13, 16, 9, 12, 14");
    expect(s2).toContain("18, 16, 20, 15, 19, 17, 21, 14, 18, 17");
    expect(s2).toContain("n₁ = 10");
    expect(s2).toContain("n₂ = 10");

    expect(s3).toContain("There is no statistically significant difference between the scores of Traditional Lecture and Gamified Learning.");
    expect(s3).toContain("There is a statistically significant difference between the scores of Traditional Lecture and Gamified Learning.");
    expect(s3).toContain("Two-tailed test.");

    expect(s4).toContain("α = 0.05");
    expect(s4).toContain("5% risk");
    expect(s4).toContain("0.025 in each");

    expect(s5).toContain("average");
    expect(s5).toContain("(4 + 5) / 2 = 4.5");
    expect(s5).toContain("R₁ = 60");
    expect(s5).toContain("R₂ = 150");

    expect(s6).toContain("U₁ = R₁ − n₁(n₁ + 1)/2 = 60 − 55 = 5");
    expect(s6).toContain("U₂ = R₂ − n₂(n₂ + 1)/2 = 150 − 55 = 95");
    expect(s6).toContain("U = min(U₁, U₂) = min(5, 95) = 5");
    expect(s6).toContain("z = (5 − 50 + 0.5) / 13.1839 = −3.3753");
    expect(s6).toContain("p = 2 × P(Z ≥ 3.3753) = 0.00074");
    expect(s6).toContain("exact permutation gives p = 0.00024");

    expect(s7).toContain("p = 0.00074 ≤ α = 0.05");
    expect(s7).toContain("Reject H₀");
    expect(s7).toContain("Reject H₀ if U ≤ 24 → U = 5 ≤ 24");
    expect(s7).toContain("Conventional table value: 23");
    expect(s7).toContain("This dataset contains ties");

    expect(s8).toContain("statistically significant evidence of a difference between Traditional Lecture and Gamified Learning");
    expect(s8).toContain("Gamified Learning showed generally higher observed scores in this sample");
    expect(s8).toContain("does not establish cause and effect");
    expect(s8).not.toMatch(/superior|proves?\b|caused/i);
    expect(s8).toContain("rank-biserial correlation = −0.90");
    expect(s8).toContain("rrb = −0.90"); // r<sub>rb</sub> as plain text

    // No hyphen-minus before a number on any slide (z, effect sizes, conclusion).
    for (const s of [s1, s2, s3, s4, s5, s6, s7, s8]) expect(s).not.toMatch(/(^|[\s(=:])-\.?\d/);
  });

  it("recomputes from saved settings (Exact method shows the exact p-value)", () => {
    renderWithSample({ ...DEFAULT_CONFIG, method: "exact" });
    key("End");
    key("ArrowLeft");
    expect(slideText()).toContain("p = 0.00024 ≤ α = 0.05");
  });
});
