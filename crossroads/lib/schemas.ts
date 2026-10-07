import { z } from "zod";

// ---------- Input ----------

export const DecisionInputSchema = z.object({
  question: z.string().min(3).max(500),
  options: z.array(z.string().min(1).max(200)).min(2).max(5),
  context: z.string().max(2000).optional().default(""),
});

export type DecisionInput = z.infer<typeof DecisionInputSchema>;

// ---------- Adviser output ----------
// Each adviser scores every option 0-100 and gives reasoning.

export const OptionScoreSchema = z.object({
  option: z.string(),
  score: z.number().min(0).max(100),
  reasoning: z.string(),
});

export const AdviserOutputSchema = z.object({
  perspective: z.string(),
  summary: z.string(),
  scores: z.array(OptionScoreSchema),
  keyConsiderations: z.array(z.string()).max(6),
});

export type AdviserOutput = z.infer<typeof AdviserOutputSchema>;

export const ADVISER_ROLES = [
  "realist",
  "strategist",
  "values",
  "devils_advocate",
] as const;

export type AdviserRole = (typeof ADVISER_ROLES)[number];

export const ADVISER_LABELS: Record<AdviserRole, string> = {
  realist: "The Realist",
  strategist: "The Strategist",
  values: "The Values Advocate",
  devils_advocate: "The Devil's Advocate",
};

// ---------- Reviewer output ----------
// Anonymous reviewers critique the set of adviser outputs (not knowing who said what).

export const ReviewerOutputSchema = z.object({
  reviewerFocus: z.string(),
  argumentQualityNotes: z.array(
    z.object({
      targetPerspective: z.string(),
      note: z.string(),
      qualityAdjustment: z.number().min(-15).max(15),
    })
  ),
  blindSpots: z.array(z.string()).max(6),
});

export type ReviewerOutput = z.infer<typeof ReviewerOutputSchema>;

export const REVIEWER_FOCI = ["argument_quality", "blind_spots"] as const;
export type ReviewerFocus = (typeof REVIEWER_FOCI)[number];

// ---------- Scoring (deterministic, computed in code) ----------

export const OptionFinalScoreSchema = z.object({
  option: z.string(),
  averageScore: z.number(),
  adjustedScore: z.number(),
  perAdviser: z.record(z.string(), z.number()),
});

export type OptionFinalScore = z.infer<typeof OptionFinalScoreSchema>;

// ---------- Synthesis output ----------

export const SynthesisOutputSchema = z.object({
  recommendation: z.string(),
  why: z.string(),
  biggestTradeoff: z.string(),
  biggestRisk: z.string(),
  whatCouldChangeIt: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
});

export type SynthesisOutput = z.infer<typeof SynthesisOutputSchema>;

// ---------- Final API response ----------

export const AdviserResultSchema = z.object({
  role: z.string(),
  label: z.string(),
  status: z.enum(["ok", "failed"]),
  output: AdviserOutputSchema.nullable(),
  error: z.string().nullable(),
});
export type AdviserResult = z.infer<typeof AdviserResultSchema>;

export const ReviewerResultSchema = z.object({
  focus: z.string(),
  status: z.enum(["ok", "failed"]),
  output: ReviewerOutputSchema.nullable(),
  error: z.string().nullable(),
});
export type ReviewerResult = z.infer<typeof ReviewerResultSchema>;

export const DecideResponseSchema = z.object({
  input: DecisionInputSchema,
  advisers: z.array(AdviserResultSchema),
  reviewers: z.array(ReviewerResultSchema),
  scores: z.array(OptionFinalScoreSchema),
  synthesis: SynthesisOutputSchema,
});

export type DecideResponse = z.infer<typeof DecideResponseSchema>;
