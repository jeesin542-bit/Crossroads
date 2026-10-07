# Crossroads 🧭

An AI multi-perspective decision assistant — hackathon MVP.

Describe a decision and 2-5 options. Crossroads runs them through a panel of
four AI advisers, has two anonymous reviewers critique the panel's reasoning,
deterministically combines the scores in code, and synthesizes one clear
recommendation with tradeoffs, risks, and a confidence level.

## Pipeline (`/api/decide`)

1. **4 advisers run concurrently** (`Promise.allSettled`, so one failure
   doesn't kill the decision): Realist, Strategist, Values Advocate, Devil's
   Advocate. Each returns a zod-validated JSON object with per-option scores
   and reasoning.
2. **2 anonymous reviewers run concurrently**, auditing the (anonymized)
   adviser outputs for argument quality and blind spots the panel missed.
3. **Deterministic score averaging in code** — adviser scores per option are
   averaged, then nudged by the reviewers' argument-quality adjustments. No
   AI involved in this step, just arithmetic (`lib/scoring.ts`).
4. **One synthesis call** turns everything into a final recommendation, why,
   biggest tradeoff, biggest risk, what could change it, and a confidence
   level.

All AI calls go through the configured OpenAI-compatible endpoint (`lib/ai.ts`),
server-side only — the key is never exposed to the client. Defaults use Gemini
(`gemini-2.5-flash`); set `AI_BASE_URL` / `AI_MODEL` / `AI_API_KEY` in
`.env.local` to point at any other OpenAI-compatible provider (e.g. local
Ollama). See `.env.local.example`.

## Running it

```bash
npm install
cp .env.local.example .env.local   # choose Ollama (local, free) or a cloud key
npm run dev
```

Open http://localhost:3000.

### Demo mode

No API key? Click **"Try the demo example"** on the form at any time — it
runs the full UI flow (loading stages, adviser cards, reviewer notes, scores,
synthesis) against a canned example in `lib/demo.ts` with zero API calls.

To force the *entire app* into demo mode (every submission returns the
canned example, useful for a guaranteed-reliable live demo), set:

```
NEXT_PUBLIC_DEMO_MODE=true
```

## File structure

```
app/api/decide/route.ts   — orchestrates the full pipeline
lib/ai.ts                 — AI client (OpenAI-compatible, env-driven) + JSON validation/retry
lib/prompts.ts             — prompt builders for advisers / reviewers / synthesis
lib/schemas.ts              — zod schemas for every AI response + API shapes
lib/scoring.ts               — deterministic score averaging + reviewer adjustments
lib/demo.ts                   — canned example input + full response for DEMO_MODE
lib/pipeline-stages.ts         — labels/details shown in the loading UI
lib/config.ts                   — DEMO_MODE flag
components/DecisionForm.tsx      — question + options + context input
components/LoadingStages.tsx      — animated pipeline-stage progress
components/AdviserCard.tsx         — one adviser's scores + reasoning
components/ReviewerNotes.tsx        — anonymous reviewer notes
components/ScoreBars.tsx             — final deterministic scores per option
components/RecommendationCard.tsx     — final synthesis
```

## Notes

- No auth, no database, no payments — everything lives in request/response
  state on the client.
- If an adviser or reviewer call fails, it's shown as a failed card in the UI
  and excluded from scoring rather than failing the whole request.
