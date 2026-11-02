"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Calculator, LayoutDashboard, Presentation, Table2, type LucideIcon } from "lucide-react";
import { NAV_ITEMS, type NavIcon } from "@/constants/app";

const ICONS: Record<NavIcon, LucideIcon> = {
  home: LayoutDashboard,
  calculator: Calculator,
  presentation: Presentation,
  book: BookOpen,
  table: Table2,
};

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = ICONS[item.icon];
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-accent-soft text-accent" : "text-ink-soft hover:bg-subtle hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
