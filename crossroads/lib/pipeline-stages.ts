export interface PipelineStage {
  id: string;
  label: string;
  detail: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "advisers",
    label: "Consulting 4 advisers",
    detail: "Realist, Strategist, Values Advocate, and Devil's Advocate are each scoring your options independently.",
  },
  {
    id: "review",
    label: "Anonymous peer review",
    detail: "Two blind reviewers are auditing argument quality and hunting for blind spots the advisers missed.",
  },
  {
    id: "scoring",
    label: "Calculating final scores",
    detail: "Averaging adviser scores and applying reviewer quality adjustments.",
  },
  {
    id: "synthesis",
    label: "Synthesizing recommendation",
    detail: "Weighing every perspective into one clear recommendation, tradeoff, risk, and confidence level.",
  },
];
