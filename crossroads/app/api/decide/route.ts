import { NextRequest, NextResponse } from "next/server";
import { callJson } from "@/lib/ai";
import {
  buildAdviserPrompt,
  buildReviewerPrompt,
  buildSynthesisPrompt,
  ADVISER_LABEL_LOOKUP,
} from "@/lib/prompts";
import {
  ADVISER_ROLES,
  AdviserOutputSchema,
  AdviserResult,
  DecisionInputSchema,
  ReviewerOutputSchema,
  ReviewerResult,
  SynthesisOutputSchema,
  AdviserRole,
  REVIEWER_FOCI,
} from "@/lib/schemas";
import { buildPerspectiveLabelMap, computeFinalScores } from "@/lib/scoring";

export const runtime = "nodejs";
export const maxDuration = 60;

// ---------- Simple in-memory rate limiter (per IP) ----------
// The decide pipeline burns ~7 model calls per request; this keeps one
// browser (or one curious user) from hammering the endpoint.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;
const requestLog = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (requestLog.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  requestLog.set(key, hits);
  return hits.length > RATE_LIMIT_MAX;
}

/** Fisher-Yates shuffle; returns a new array, input untouched. */
function shuffled<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function POST(req: NextRequest) {
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsedInput = DecisionInputSchema.safeParse(body);
  if (!parsedInput.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsedInput.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsedInput.data;

  if (!process.env.AI_API_KEY && !process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Server is missing an AI API key. Set AI_API_KEY (or legacy GEMINI_API_KEY) in your environment, or try DEMO_MODE.",
      },
      { status: 500 }
    );
  }

  // ---------- Stage 1: 4 advisers, concurrently ----------
  const adviserSettled = await Promise.allSettled(
    ADVISER_ROLES.map(async (role) => {
      const { system, user } = buildAdviserPrompt(role, input);
      const output = await callJson(AdviserOutputSchema, { system, user, temperature: 0.7 });
      return { role, output };
    })
  );

  const advisers: AdviserResult[] = ADVISER_ROLES.map((role, i) => {
    const settled = adviserSettled[i];
    const label = ADVISER_LABEL_LOOKUP[role as AdviserRole].label;
    if (settled.status === "fulfilled") {
      return { role, label, status: "ok", output: settled.value.output, error: null };
    }
    return {
      role,
      label,
      status: "failed",
      output: null,
      error: settled.reason instanceof Error ? settled.reason.message : "Unknown error",
    };
  });

  const successfulAdvisers = advisers.filter((a) => a.status === "ok" && a.output !== null);

  if (successfulAdvisers.length === 0) {
    return NextResponse.json(
      { error: "All advisers failed to respond. Please try again.", advisers },
      { status: 502 }
    );
  }

  // ---------- Stage 2: 2 anonymous reviewers, concurrently ----------
  // Anonymized perspectives are genuinely shuffled (Fisher-Yates) so the
  // reviewers can't learn position -> identity. The label map is built from
  // the shuffled order, so scoring still translates back to real labels.
  const shuffledAdvisers = shuffled(
    successfulAdvisers.map((a) => ({ role: a.role, label: a.label, output: a.output }))
  );
  const adviserOutputsForReview = shuffledAdvisers.map((a) => a.output!);
  const perspectiveLabelMap = buildPerspectiveLabelMap(shuffledAdvisers);

  const reviewerSettled = await Promise.allSettled(
    REVIEWER_FOCI.map(async (focus) => {
      const { system, user } = buildReviewerPrompt(focus, input, adviserOutputsForReview);
      const output = await callJson(ReviewerOutputSchema, { system, user, temperature: 0.5 });
      return { focus, output };
    })
  );

  const reviewers: ReviewerResult[] = REVIEWER_FOCI.map((focus, i) => {
    const settled = reviewerSettled[i];
    if (settled.status === "fulfilled") {
      // Translate the anonymized "Perspective A/B/C" labels back to real
      // adviser labels now that scoring (which needs the anonymized form)
      // is done, purely for a clearer UI.
      const output = settled.value.output;
      const remapped = {
        ...output,
        argumentQualityNotes: output.argumentQualityNotes.map((n) => ({
          ...n,
          targetPerspective: perspectiveLabelMap[n.targetPerspective] ?? n.targetPerspective,
        })),
      };
      return { focus, status: "ok" as const, output: remapped, error: null };
    }
    return {
      focus,
      status: "failed" as const,
      output: null,
      error: settled.reason instanceof Error ? settled.reason.message : "Unknown error",
    };
  });

  // ---------- Stage 3: deterministic score averaging in code ----------
  const scores = computeFinalScores(
    input.options,
    advisers.map((a) => ({ role: a.role, label: a.label, output: a.output })),
    reviewers.map((r) => ({ focus: r.focus, output: r.output })),
    perspectiveLabelMap
  );

  // ---------- Stage 4: synthesis ----------
  const reviewerNotesForSynthesis = reviewers
    .filter((r) => r.output !== null)
    .map((r) => ({
      focus: r.focus,
      blindSpots: r.output!.blindSpots,
      notes: r.output!.argumentQualityNotes.map((n) => ({
        targetPerspective: n.targetPerspective, // already remapped to real adviser labels above
        note: n.note,
      })),
    }));

  let synthesis;
  try {
    const { system, user } = buildSynthesisPrompt(
      input,
      advisers.map((a) => ({ role: a.role, label: a.label, output: a.output })),
      reviewerNotesForSynthesis,
      scores.map((s) => ({ option: s.option, adjustedScore: s.adjustedScore }))
    );
    synthesis = await callJson(SynthesisOutputSchema, { system, user, temperature: 0.5 });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Synthesis step failed.",
        detail: err instanceof Error ? err.message : "Unknown error",
        advisers,
        reviewers,
        scores,
      },
      { status: 502 }
    );
  }

  const response = {
    input,
    advisers,
    reviewers,
    scores,
    synthesis,
  };

  return NextResponse.json(response, { status: 200 });
}
