import type { AnalysisInput } from "@/types/statistics";

export const SAMPLE_RESEARCH_PROBLEM =
  "A teacher wants to determine whether there is a statistically significant difference in quiz scores between students taught using Traditional Lecture and students taught using Gamified Learning.";

export const SAMPLE_INPUT: AnalysisInput = {
  groupA: {
    name: "Traditional Lecture",
    description: "Quiz scores of students taught using traditional lecture.",
    values: [12, 15, 11, 14, 10, 13, 16, 9, 12, 14],
  },
  groupB: {
    name: "Gamified Learning",
    description: "Quiz scores of students taught using gamified learning.",
    values: [18, 16, 20, 15, 19, 17, 21, 14, 18, 17],
  },
};
