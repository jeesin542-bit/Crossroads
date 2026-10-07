import { AdviserRole, DecisionInput, AdviserOutput, ReviewerFocus } from "./schemas";

const JSON_RULES = `
Respond with ONLY valid JSON. No markdown fences, no commentary, no leading/trailing text.
All strings must be plain text (no markdown formatting).
`;

function formatOptions(options: string[]): string {
  return options.map((o, i) => `${i + 1}. ${o}`).join("\n");
}

function baseContext(input: DecisionInput): string {
  return `
DECISION QUESTION:
${input.question}

OPTIONS BEING CONSIDERED:
${formatOptions(input.options)}

ADDITIONAL CONTEXT FROM THE DECISION-MAKER:
${input.context?.trim() ? input.context : "(none provided)"}
`.trim();
}

const ADVISER_PERSONAS: Record<AdviserRole, { label: string; persona: string }> = {
  realist: {
    label: "The Realist",
    persona:
      "You are THE REALIST. You evaluate options purely on practical, concrete, near-term feasibility: time, money, effort, logistics, what is actually likely to happen versus wishful thinking. You are skeptical of vague plans and reward options that are grounded and achievable right now.",
  },
  strategist: {
    label: "The Strategist",
    persona:
      "You are THE STRATEGIST. You evaluate options on long-term positioning: optionality, compounding advantages, second-order effects, career/life trajectory, and how each choice opens or closes future doors. You think several moves ahead.",
  },
  values: {
    label: "The Values Advocate",
    persona:
      "You are THE VALUES ADVOCATE. You evaluate options based on alignment with the person's values, relationships, integrity, meaning, and emotional wellbeing. You care about whether a choice is true to who they are and who they want to become, not just whether it 'works'.",
  },
  devils_advocate: {
    label: "The Devil's Advocate",
    persona:
      "You are THE DEVIL'S ADVOCATE. Your job is to stress-test every option by surfacing the strongest counterarguments, hidden downsides, overlooked risks, and reasons the obvious choice might be wrong. You are deliberately contrarian and look for what everyone else is missing. You still score options honestly, but your reasoning should highlight risks others would gloss over.",
  },
};

export function buildAdviserPrompt(role: AdviserRole, input: DecisionInput): { system: string; user: string } {
  const { persona } = ADVISER_PERSONAS[role];

  const system = `${persona}

You will be given a decision with 2-5 options. Score EVERY option from 0-100 (100 = strongly recommended from your perspective, 0 = strongly against), with reasoning specific to your lens.

${JSON_RULES}
Return JSON matching exactly this shape:
{
  "perspective": "<your persona name>",
  "summary": "<2-3 sentence overview of how you see this decision>",
  "scores": [
    { "option": "<exact option text>", "score": <0-100 integer>, "reasoning": "<2-4 sentences from your perspective>" }
  ],
  "keyConsiderations": ["<short bullet>", "..."]
}
"scores" must contain exactly one entry per option, using the exact option text given, in the given order.`;

  const user = baseContext(input);

  return { system, user };
}

const REVIEWER_PERSONAS: Record<ReviewerFocus, { label: string; persona: string }> = {
  argument_quality: {
    label: "Argument Quality Reviewer",
    persona:
      "You are an ANONYMOUS, impartial reviewer auditing a panel of advisers' arguments about a decision. You do not know who wrote what and should judge purely on the merits of the reasoning. For each adviser perspective, assess whether their reasoning was well-supported, specific, and logically sound, or vague/generic/overconfident. Recommend a small score adjustment (-15 to +15) to apply to that adviser's scores overall, to correct for weak or inflated reasoning.",
  },
  blind_spots: {
    label: "Blind Spot Reviewer",
    persona:
      "You are an ANONYMOUS, impartial reviewer whose job is to find blind spots: important considerations that NONE of the advisers raised, options or angles the group collectively missed, and places where the whole panel might share a bias. You also lightly judge argument quality per perspective (minor adjustment only) but your main value is surfacing what's missing.",
  },
};

export function buildReviewerPrompt(
  focus: ReviewerFocus,
  input: DecisionInput,
  adviserOutputs: { perspective: string; summary: string; scores: { option: string; score: number; reasoning: string }[]; keyConsiderations: string[] }[]
): { system: string; user: string } {
  const { persona } = REVIEWER_PERSONAS[focus];

  const system = `${persona}

You are reviewing ANONYMIZED adviser outputs below (labeled Perspective A, B, C... in random order — this is not necessarily their real identity order). Do not assume which named role wrote which one.

${JSON_RULES}
Return JSON matching exactly this shape:
{
  "reviewerFocus": "${focus}",
  "argumentQualityNotes": [
    { "targetPerspective": "<perspective label as given, e.g. 'Perspective A'>", "note": "<1-2 sentence critique>", "qualityAdjustment": <-15 to 15 integer> }
  ],
  "blindSpots": ["<important thing nobody raised>", "..."]
}
Include one argumentQualityNotes entry per perspective shown below. If this is not your main focus, you may still provide brief notes but keep qualityAdjustment small (-5 to 5).`;

  const anonymized = adviserOutputs
    .map((a, i) => {
      const label = `Perspective ${String.fromCharCode(65 + i)}`;
      return `${label}:
Summary: ${a.summary}
Key considerations: ${a.keyConsiderations.join("; ")}
Scores:
${a.scores.map((s) => `  - ${s.option}: ${s.score}/100 — ${s.reasoning}`).join("\n")}`;
    })
    .join("\n\n");

  const user = `${baseContext(input)}

ANONYMIZED ADVISER OUTPUTS TO REVIEW:

${anonymized}`;

  return { system, user };
}

export function buildSynthesisPrompt(
  input: DecisionInput,
  adviserResults: { role: string; label: string; output: AdviserOutput | null }[],
  reviewerNotes: { focus: string; blindSpots: string[]; notes: { targetPerspective: string; note: string }[] }[],
  finalScores: { option: string; adjustedScore: number }[]
): { system: string; user: string } {
  const system = `You are the final SYNTHESIZER for Crossroads, an AI decision assistant. You have access to a panel of advisers' analyses, anonymous peer review notes, and deterministic final scores computed in code. Your job is to write a clear, honest, human final recommendation. Do not just repeat the highest score — use judgment, and be direct about uncertainty and tradeoffs.

${JSON_RULES}
Return JSON matching exactly this shape:
{
  "recommendation": "<the option you recommend, exact option text, or 'no clear winner' framing if genuinely a toss-up>",
  "why": "<3-5 sentences on why, synthesizing the strongest points across advisers>",
  "biggestTradeoff": "<1-3 sentences: the main thing being given up with this choice>",
  "biggestRisk": "<1-3 sentences: the main risk if this choice goes wrong>",
  "whatCouldChangeIt": "<1-3 sentences: what new information or change in circumstances would flip the recommendation>",
  "confidence": "low" | "medium" | "high"
}`;

  const advisersText = adviserResults
    .map((a) => {
      if (!a.output) return `${a.label}: (failed to respond, excluded)`;
      return `${a.label} — ${a.output.summary}\nKey considerations: ${a.output.keyConsiderations.join("; ")}`;
    })
    .join("\n\n");

  const reviewersText = reviewerNotes
    .map((r) => {
      const blind = r.blindSpots.length ? `Blind spots raised: ${r.blindSpots.join("; ")}` : "";
      const notes = r.notes.map((n) => `  ${n.targetPerspective}: ${n.note}`).join("\n");
      return `Reviewer (${r.focus}):\n${blind}\n${notes}`;
    })
    .join("\n\n");

  const scoresText = finalScores
    .map((s) => `- ${s.option}: ${s.adjustedScore.toFixed(1)} / 100 (final adjusted score)`)
    .join("\n");

  const user = `${baseContext(input)}

ADVISER SUMMARIES:
${advisersText}

ANONYMOUS REVIEWER NOTES:
${reviewersText}

DETERMINISTIC FINAL SCORES (computed in code by averaging adviser scores + reviewer quality adjustments):
${scoresText}`;

  return { system, user };
}

export const ADVISER_LABEL_LOOKUP = ADVISER_PERSONAS;
