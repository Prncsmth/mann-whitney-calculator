"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/** Small floating button that appears after scrolling down and returns to the top. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed right-4 bottom-4 z-30 inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 py-2.5 text-sm font-medium text-ink shadow-md hover:bg-subtle sm:right-6 sm:bottom-6"
    >
      <ArrowUp className="h-4 w-4" aria-hidden />
      Back to top
    </button>
  );
}
