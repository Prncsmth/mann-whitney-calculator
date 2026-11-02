import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

/** Building blocks for slides. All sizes come from the st-* classes in globals.css. */

export function SlideHeading({ children }: { children: ReactNode }) {
  return (
    <header className="border-b border-line pb-[0.4em]">
      <h2 className="st-title font-semibold tracking-tight text-ink">{children}</h2>
    </header>
  );
}

export function SlidePanel({ children, tone = "plain", className = "" }: {
  children: ReactNode;
  tone?: "plain" | "accent" | "subtle";
  className?: string;
}) {
  const tones = {
    plain: "border-line bg-surface",
    accent: "border-accent-line bg-accent-soft",
    subtle: "border-line bg-subtle",
  };
  return <div className={`st-pad rounded-lg border ${tones[tone]} ${className}`}>{children}</div>;
}

export function SlideLabel({ children }: { children: ReactNode }) {
  return <p className="st-small mb-[0.35em] font-medium text-muted">{children}</p>;
}

/** One formula line: label above, monospace formula below. */
export function SlideFormula({ label, children, strong = false }: {
  label?: ReactNode;
  children: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="border-l-[3px] border-accent pl-[1em]">
      {label && <p className="st-small text-muted">{label}</p>}
      <p className={`st-formula font-mono wrap-break-word ${strong ? "font-semibold text-ink" : "text-ink-soft"}`}>{children}</p>
    </div>
  );
}

export function SlideWarning({ children }: { children: ReactNode }) {
  return (
    <div className="st-small flex gap-[0.6em] rounded-lg border border-warn-line bg-warn-soft px-[1.1em] py-[0.8em] text-warn">
      <AlertTriangle className="mt-[0.2em] h-[1.1em] w-[1.1em] shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
