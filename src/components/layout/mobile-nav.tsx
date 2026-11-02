"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { NavLinks } from "./nav-links";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close navigation" : "Open navigation"}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line text-ink-soft hover:bg-subtle"
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="absolute inset-x-0 top-full border-b border-line bg-surface px-3 py-3 shadow-sm"
        >
          <NavLinks onNavigate={() => setOpen(false)} />
        </nav>
      )}
    </>
  );
}
