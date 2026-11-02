"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Maximize, Minimize, X } from "lucide-react";
import { useSavedAnalysis } from "@/hooks/use-saved-analysis";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { buttonStyles } from "@/components/ui/primitives";
import { SLIDES } from "./slides";
import { ForestLine } from "./forest-line";

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)
  );
}

function StatusScreen({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4">
      <div className="max-w-lg rounded-lg border border-line bg-surface px-8 py-10 text-center" role="status">
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 leading-relaxed text-muted">{message}</p>
        <Link href="/calculator" className={`${buttonStyles.primary} mt-6`}>
          Open Calculator
        </Link>
      </div>
    </main>
  );
}

export function PresentationDeck() {
  const saved = useSavedAnalysis();
  const fullscreen = useFullscreen();
  const [index, setIndex] = useState(0);
  const last = SLIDES.length - 1;

  const go = useCallback((i: number) => setIndex(Math.min(last, Math.max(0, i))), [last]);
  const next = useCallback(() => setIndex((i) => Math.min(last, i + 1)), [last]);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  const ready = saved.status === "ready";
  const { toggle: toggleFullscreen, supported: fullscreenSupported } = fullscreen;

  useEffect(() => {
    if (!ready) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return;
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          prev();
          break;
        case "Home":
          e.preventDefault();
          go(0);
          break;
        case "End":
          e.preventDefault();
          go(last);
          break;
        case "f":
        case "F":
          if (fullscreenSupported) void toggleFullscreen();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready, next, prev, go, last, fullscreenSupported, toggleFullscreen]);

  if (saved.status === "loading") {
    return <main className="min-h-dvh bg-canvas" aria-busy="true" />;
  }
  if (saved.status === "empty") {
    return (
      <StatusScreen
        title="No saved analysis yet"
        message="Presentation Mode shows the latest calculation. Open the calculator, enter or load data, and press Calculate first."
      />
    );
  }
  if (saved.status === "invalid") {
    return <StatusScreen title="Saved analysis cannot be used" message={`${saved.reason} Please calculate again in the calculator.`} />;
  }
  if (saved.status === "unavailable") {
    return (
      <StatusScreen
        title="Browser storage is unavailable"
        message="Presentation Mode receives the analysis through your browser's local storage, which is blocked or disabled (for example in some private windows). Allow site data and calculate again."
      />
    );
  }

  const slide = SLIDES[index];
  const iconButton =
    "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-sm font-medium text-ink hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="slide-root flex h-dvh flex-col text-ink">
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface/90 px-4 py-2 backdrop-blur sm:px-6">
        <p className="min-w-0 truncate text-sm text-muted">
          <span className="font-semibold text-ink">Mann–Whitney U Test</span>
          {index > 0 && <span className="hidden sm:inline"> · {slide.title}</span>}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {fullscreen.supported && (
            <button
              type="button"
              onClick={() => void fullscreen.toggle()}
              className={iconButton}
              aria-label={fullscreen.active ? "Exit full screen" : "Enter full screen"}
              title="Full screen (F)"
            >
              {fullscreen.active ? <Minimize className="h-4 w-4" aria-hidden /> : <Maximize className="h-4 w-4" aria-hidden />}
              <span className="hidden md:inline">{fullscreen.active ? "Exit full screen" : "Full screen"}</span>
            </button>
          )}
          <Link href="/calculator" className={iconButton}>
            <X className="h-4 w-4" aria-hidden />
            <span>
              Exit<span className="hidden md:inline"> Presentation</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Slide */}
      <main
        className="relative flex min-h-0 flex-1 overflow-y-auto"
        role="region"
        aria-roledescription="slide"
        aria-label={`Slide ${index + 1} of ${SLIDES.length}: ${slide.title}`}
      >
        {index === 0 && <ForestLine />}
        <div
          key={index}
          className="relative z-10 m-auto w-full max-w-[min(92vw,1720px)] px-4 py-8 sm:px-[4vw]"
          data-testid="slide"
        >
          {slide.render({ result: saved.result })}
        </div>
      </main>

      {/* Bottom bar */}
      <footer className="relative z-10 shrink-0 border-t border-line bg-surface/90 px-4 py-2.5 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={prev} disabled={index === 0} className={iconButton} aria-label="Previous slide">
            <ChevronLeft className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Previous</span>
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <ol className="flex flex-1 gap-1" aria-label="Slides">
              {SLIDES.map((s, i) => (
                <li key={s.title} className="flex-1">
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Go to slide ${i + 1}: ${s.title}`}
                    aria-current={i === index ? "step" : undefined}
                    className="block w-full py-2"
                  >
                    <span className={`block h-1.5 rounded-full ${i <= index ? "bg-accent" : "bg-line-strong"}`} />
                  </button>
                </li>
              ))}
            </ol>
            <p className="shrink-0 font-mono text-sm text-ink-soft tabular-nums" aria-live="polite" data-testid="slide-counter">
              {index + 1} / {SLIDES.length}
            </p>
          </div>
          <button type="button" onClick={next} disabled={index === last} className={iconButton} aria-label="Next slide">
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </footer>
    </div>
  );
}
