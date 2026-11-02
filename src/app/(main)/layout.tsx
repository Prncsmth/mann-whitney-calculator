import { AppShell } from "@/components/layout/app-shell";

/** Pages with the sidebar navigation. Presentation Mode lives outside this group. */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
