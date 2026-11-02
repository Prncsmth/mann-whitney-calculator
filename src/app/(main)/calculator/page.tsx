import type { Metadata } from "next";
import { CalculatorWorkspace } from "@/components/calculator/calculator-workspace";
import { PageHeader } from "@/components/ui/primitives";
import { HowToUse } from "@/components/guide/student-guide";

export const metadata: Metadata = { title: "Calculator" };

export default function CalculatorPage() {
  return (
    <>
      <PageHeader
        title="Calculator"
        description="Enter two independent samples, choose the test settings, and calculate. Every value shown is computed from your data in the browser."
      />
      <HowToUse compact />
      <CalculatorWorkspace />
    </>
  );
}
