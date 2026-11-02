export const APP_NAME = "Mann–Whitney U Test Calculator";
export const APP_SUBTITLE = "Statistical Analysis for Two Independent Samples";

export const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: "home" },
  { href: "/calculator", label: "Calculator", icon: "calculator" },
  { href: "/critical-values", label: "Critical Values Table", icon: "table" },
  { href: "/presentation", label: "Presentation Mode", icon: "presentation" },
  { href: "/about", label: "Method Notes", icon: "book" },
] as const;

export type NavIcon = (typeof NAV_ITEMS)[number]["icon"];
