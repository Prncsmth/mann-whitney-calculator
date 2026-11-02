import Link from "next/link";
import { Sigma } from "lucide-react";
import { APP_NAME, APP_SUBTITLE } from "@/constants/app";
import { NavLinks } from "./nav-links";
import { MobileNav } from "./mobile-nav";

function Brand() {
  return (
    <Link href="/" className="flex items-start gap-3 rounded-md">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-on-accent">
        <Sigma className="h-4.5 w-4.5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] leading-tight font-semibold text-ink">{APP_NAME}</span>
        <span className="mt-0.5 block text-xs leading-snug text-muted">{APP_SUBTITLE}</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line theme-brand lg:flex">
        <div className="border-b border-line px-5 py-5">
          <Brand />
        </div>
        <nav aria-label="Main" className="flex-1 px-3 py-4">
          <NavLinks />
        </nav>
        <p className="border-t border-line px-5 py-4 text-xs leading-relaxed text-muted">
          All calculations run in your browser. Data is never sent to a server.
        </p>
      </aside>

      {/* Mobile / tablet header */}
      <header className="theme-brand sticky top-0 z-30 border-b border-line lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Brand />
          <MobileNav />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
