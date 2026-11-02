import type { Metadata } from "next";
import { PresentationDeck } from "@/components/presentation/presentation-deck";

export const metadata: Metadata = { title: "Presentation Mode" };

/** Full-screen presentation of the latest saved analysis (no sidebar). */
export default function PresentationPage() {
  return <PresentationDeck />;
}
