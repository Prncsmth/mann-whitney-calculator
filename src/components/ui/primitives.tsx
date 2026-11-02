import type { ReactNode } from "react";
import { AlertTriangle, Info } from "lucide-react";

export function Card({ children, className = "", as: Tag = "section", ...rest }: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={`rounded-lg border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.25)] ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, actions, id }: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  id?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <h3 id={id} className="text-[15px] font-semibold text-ink">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const buttonStyles = {
  primary: `${BUTTON_BASE} bg-accent px-4 py-2.5 text-on-accent hover:bg-accent-hover`,
  secondary: `${BUTTON_BASE} border border-line-strong bg-surface px-4 py-2.5 text-ink hover:bg-subtle`,
  ghost: `${BUTTON_BASE} px-2.5 py-1.5 text-muted hover:bg-subtle hover:text-ink`,
} as const;

export function Notice({ level, children }: { level: "info" | "warning" | "error"; children: ReactNode }) {
  const styles = {
    info: "border-accent-line bg-accent-soft text-ink-soft",
    warning: "border-warn-line bg-warn-soft text-warn",
    error: "border-danger-line bg-danger-soft text-danger",
  }[level];
  const Icon = level === "info" ? Info : AlertTriangle;
  return (
    <div className={`flex gap-3 rounded-md border px-4 py-3 text-sm leading-relaxed ${styles}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function StatTile({ label, value, hint, emphasis = false }: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${emphasis ? "border-accent-line bg-accent-soft" : "border-line bg-surface"}`}>
      {/* No uppercase here: it would turn n₁ into N₁, which means something else. */}
      <dt className="text-[13px] font-medium text-muted">{label}</dt>
      <dd className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${emphasis ? "text-accent" : "text-ink"}`}>{value}</dd>
      {hint && <dd className="mt-0.5 text-xs text-muted">{hint}</dd>}
    </div>
  );
}

/** A displayed formula or calculation line. */
export function Formula({ children, label }: { children: ReactNode; label?: ReactNode }) {
  return (
    <div className="rounded-md border-l-[3px] border-accent bg-subtle px-4 py-2.5">
      {label && <div className="mb-0.5 text-xs font-medium text-muted">{label}</div>}
      <div className="font-mono text-[15px] leading-relaxed wrap-break-word text-ink">{children}</div>
    </div>
  );
}

export function GroupDot({ group }: { group: "A" | "B" }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${group === "A" ? "bg-group-a" : "bg-group-b"}`}
    />
  );
}

export function PageHeader({ title, description, actions }: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">{title}</h1>
        {description && <p className="mt-2 text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
