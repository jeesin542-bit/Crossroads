import { AdviserOutput, OptionFinalScore, ReviewerOutput } from "./schemas";

export interface ScoringAdviserInput {
  role: string;
  label: string;
  output: AdviserOutput | null;
}

/**
 * Maps anonymized "Perspective A/B/C..." labels (used when sending adviser
 * outputs to reviewers) back to the real adviser labels, in the order the
 * perspectives were actually presented to the reviewers (callers shuffle
 * successful advisers first so position reveals nothing about identity).
 */
export function buildPerspectiveLabelMap(successfulAdvisers: ScoringAdviserInput[]): Record<string, string> {
  const map: Record<string, string> = {};
  successfulAdvisers.forEach((a, i) => {
    const anonLabel = `Perspective ${String.fromCharCode(65 + i)}`;
    map[anonLabel] = a.label;
  });
  return map;
}

/**
 * Deterministically averages adviser scores per option, then applies
 * reviewer "argument quality" adjustments (small +/- shifts to an
 * adviser's overall credibility) before re-averaging into a final
 * adjusted score. All math happens here in code, not via the model.
 */
export function computeFinalScores(
  options: string[],
  advisers: ScoringAdviserInput[],
  reviewers: { focus: string; output: ReviewerOutput | null }[],
  perspectiveLabelMap: Record<string, string>
): OptionFinalScore[] {
  const successfulAdvisers = advisers.filter((a) => a.output !== null) as {
    role: string;
    label: string;
    output: AdviserOutput;
  }[];

  // Aggregate quality adjustments per adviser label, averaged across reviewers that mentioned them.
  const adjustmentsByLabel: Record<string, number[]> = {};
  for (const reviewer of reviewers) {
    if (!reviewer.output) continue;
    for (const note of reviewer.output.argumentQualityNotes) {
      const realLabel = perspectiveLabelMap[note.targetPerspective] ?? note.targetPerspective;
      if (!adjustmentsByLabel[realLabel]) adjustmentsByLabel[realLabel] = [];
      adjustmentsByLabel[realLabel].push(note.qualityAdjustment);
    }
  }

  const avgAdjustmentByLabel: Record<string, number> = {};
  for (const [label, adjustments] of Object.entries(adjustmentsByLabel)) {
    avgAdjustmentByLabel[label] = adjustments.reduce((s, v) => s + v, 0) / adjustments.length;
  }

  return options.map((option) => {
    const perAdviser: Record<string, number> = {};
    const rawScores: number[] = [];
    const adjustedScores: number[] = [];

    for (const adviser of successfulAdvisers) {
      const scoreEntry = adviser.output.scores.find(
        (s) => s.option.trim().toLowerCase() === option.trim().toLowerCase()
      );
      if (!scoreEntry) continue;

      perAdviser[adviser.label] = scoreEntry.score;
      rawScores.push(scoreEntry.score);

      const adjustment = avgAdjustmentByLabel[adviser.label] ?? 0;
      const adjusted = clamp(scoreEntry.score + adjustment, 0, 100);
      adjustedScores.push(adjusted);
    }

    const averageScore = average(rawScores);
    const adjustedScore = average(adjustedScores);

    return {
      option,
      averageScore: round1(averageScore),
      adjustedScore: round1(adjustedScore),
      perAdviser,
    };
  });
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, v) => s + v, 0) / nums.length;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
