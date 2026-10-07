import { DecideResponse, DecisionInput } from "./schemas";

export const DEMO_INPUT: DecisionInput = {
  question: "Should I leave my stable job to join an early-stage startup?",
  options: [
    "Stay at my current stable job",
    "Join the early-stage startup",
  ],
  context:
    "I'm 29, no kids, modest savings (about 6 months of runway). The startup offer is roughly 20% lower base salary plus equity that could be worth a lot or nothing. My current job is secure but I feel capped on growth and the work doesn't excite me anymore. My partner is supportive either way.",
};

/**
 * A fully canned example response used by DEMO_MODE so the entire UI flow
 * (loading stages, adviser cards, reviewer notes, scores, synthesis) can be
 * exercised with zero API calls.
 */
export const DEMO_RESPONSE: DecideResponse = {
  input: DEMO_INPUT,
  advisers: [
    {
      role: "realist",
      label: "The Realist",
      status: "ok",
      error: null,
      output: {
        perspective: "The Realist",
        summary:
          "With six months of runway and a 20% pay cut, the startup is financially tight but survivable short-term. The current job is the safer bet on paper, but 'stable' doesn't mean 'good for you' if growth has actually stalled.",
        scores: [
          { option: "Stay at my current stable job", score: 62, reasoning: "Lower financial risk and predictable income, but you've already flagged feeling capped — that has real career-opportunity-cost that doesn't show up on a paycheck." },
          { option: "Join the early-stage startup", score: 54, reasoning: "A 20% pay cut against 6 months of runway is workable but tight, especially with no second income cushion beyond your partner's support. Equity is a lottery ticket, not a plan." },
        ],
        keyConsiderations: [
          "6 months runway limits how long you can absorb a lower salary",
          "Equity value is highly uncertain and shouldn't be counted as real income",
          "Partner's support reduces but doesn't eliminate financial risk",
          "'Stable' current job may be stable in pay only, not in career growth",
        ],
      },
    },
    {
      role: "strategist",
      label: "The Strategist",
      status: "ok",
      error: null,
      output: {
        perspective: "The Strategist",
        summary:
          "At 29 with no kids, this is close to the lowest-risk window of your life to take a career swing. Early-stage experience compounds: skills, network, and equity upside are all asymmetric bets that are hard to access later.",
        scores: [
          { option: "Stay at my current stable job", score: 45, reasoning: "Feeling capped now likely means the growth curve has flattened; staying optimizes for short-term stability at the cost of long-term optionality." },
          { option: "Join the early-stage startup", score: 78, reasoning: "Early employees gain broad, high-leverage experience fast, and the window to take this kind of risk (young, no dependents) is narrow and won't reopen easily." },
        ],
        keyConsiderations: [
          "Age and lack of dependents make this a uniquely low-cost time to take risk",
          "Startup experience builds a different, often more valuable skill set than staying put",
          "Feeling 'capped' is itself a strategic signal worth acting on",
          "Equity upside is a long shot but the optionality/network effects are the real prize",
        ],
      },
    },
    {
      role: "values",
      label: "The Values Advocate",
      status: "ok",
      error: null,
      output: {
        perspective: "The Values Advocate",
        summary:
          "You said the work 'doesn't excite you anymore' — that's an important signal about meaning and engagement, not just logistics. A supportive partner removes a major emotional barrier to making a values-aligned choice.",
        scores: [
          { option: "Stay at my current stable job", score: 40, reasoning: "Staying somewhere that no longer excites you, purely for security, can quietly erode motivation and self-respect over time." },
          { option: "Join the early-stage startup", score: 72, reasoning: "Choosing growth and excitement, backed by a supportive partner, aligns with living intentionally rather than defaulting to the safe path out of fear." },
        ],
        keyConsiderations: [
          "Lack of excitement at current job is a meaningful, not trivial, data point",
          "Partner's explicit support removes a common source of regret/resentment later",
          "Values alignment matters for long-term satisfaction, not just the next raise",
          "Regret of not trying is often more lasting than regret of a financial setback",
        ],
      },
    },
    {
      role: "devils_advocate",
      label: "The Devil's Advocate",
      status: "ok",
      error: null,
      output: {
        perspective: "The Devil's Advocate",
        summary:
          "Everyone loves the startup-leap narrative, but 'early-stage' and 'modest savings' is a specific combination that has sunk a lot of people. Nobody has asked whether this particular startup is actually a good bet, versus startups in general.",
        scores: [
          { option: "Stay at my current stable job", score: 58, reasoning: "Boring is underrated: you can job-search for a better role, negotiate growth internally, or build a side project while employed — none of which require burning your runway." },
          { option: "Join the early-stage startup", score: 48, reasoning: "The question treats 'the startup' as interchangeable with 'startups in general' — but this specific company's traction, funding, and team haven't been evaluated at all. Six months of runway can evaporate fast if the startup itself struggles." },
        ],
        keyConsiderations: [
          "No information given about this specific startup's funding, traction, or founders",
          "Feeling 'capped' could be solved by changing teams/roles internally or job-hopping to another stable company",
          "Six months of runway assumes nothing else goes wrong (medical, family, etc.)",
          "Equity is commonly worth zero; treat it as a bonus, never as a reason on its own",
        ],
      },
    },
  ],
  reviewers: [
    {
      focus: "argument_quality",
      status: "ok",
      error: null,
      output: {
        reviewerFocus: "argument_quality",
        argumentQualityNotes: [
          { targetPerspective: "The Realist", note: "Grounded and specific about runway math; appropriately cautious without being alarmist.", qualityAdjustment: 3 },
          { targetPerspective: "The Strategist", note: "Compelling on optionality but leans on generalities about 'early-stage experience' without engaging the specific financial constraint.", qualityAdjustment: -4 },
          { targetPerspective: "The Values Advocate", note: "Correctly identifies an important emotional signal, but assumes excitement will outlast financial stress, which isn't established.", qualityAdjustment: -2 },
          { targetPerspective: "The Devil's Advocate", note: "Strongest reasoning in the set — the only one to note that the specific startup's quality hasn't been evaluated at all, a genuine logical gap in the others' arguments.", qualityAdjustment: 6 },
        ],
        blindSpots: [
          "No adviser asked about the startup's funding stage, runway, or founder track record",
          "No one considered a middle path: negotiating a sabbatical or part-time trial with the startup",
        ],
      },
    },
    {
      focus: "blind_spots",
      status: "ok",
      error: null,
      output: {
        reviewerFocus: "blind_spots",
        argumentQualityNotes: [
          { targetPerspective: "The Realist", note: "Solid, but doesn't address whether 6 months is enough buffer if a job search is needed after.", qualityAdjustment: 1 },
          { targetPerspective: "The Strategist", note: "Assumes startup experience is uniformly valuable; doesn't address failure modes.", qualityAdjustment: -3 },
          { targetPerspective: "The Values Advocate", note: "Good emotional read, but doesn't weigh how financial stress itself affects wellbeing.", qualityAdjustment: -1 },
          { targetPerspective: "The Devil's Advocate", note: "Useful skepticism, slightly overcorrects by treating all unknowns as red flags.", qualityAdjustment: 2 },
        ],
        blindSpots: [
          "Nobody discussed negotiating: could current employer counter-offer or provide a growth path if asked directly?",
          "Nobody discussed a hybrid option — e.g. advising/consulting for the startup before committing fully",
          "Health insurance and other benefits lost by leaving a stable job were never mentioned",
        ],
      },
    },
  ],
  scores: [
    {
      option: "Stay at my current stable job",
      averageScore: 51.3,
      adjustedScore: 51.7,
      perAdviser: {
        "The Realist": 62,
        "The Strategist": 45,
        "The Values Advocate": 40,
        "The Devil's Advocate": 58,
      },
    },
    {
      option: "Join the early-stage startup",
      averageScore: 63,
      adjustedScore: 61.4,
      perAdviser: {
        "The Realist": 54,
        "The Strategist": 78,
        "The Values Advocate": 72,
        "The Devil's Advocate": 48,
      },
    },
  ],
  synthesis: {
    recommendation: "Join the early-stage startup",
    why:
      "Across the panel, the startup edges out staying put, mainly on strategic and values grounds: you're at a uniquely low-cost moment to take this risk, you've explicitly lost enthusiasm for your current role, and your partner supports the move. The Realist and Devil's Advocate both raise real financial caution, but neither found staying to be a clearly superior choice — just a safer one.",
    biggestTradeoff:
      "You're trading income certainty and benefits for growth, excitement, and optionality. If the startup underperforms, you'll have given up 20% pay and possibly job security for equity that may be worth little.",
    biggestRisk:
      "Running low on runway if the startup struggles or if you need a longer-than-expected job search afterward — compounded by the fact that no one has evaluated this specific startup's funding or traction.",
    whatCouldChangeIt:
      "Learning concrete details about the startup's funding runway and founder track record, or discovering your current employer would offer a real growth path if asked, would meaningfully shift this recommendation.",
    confidence: "medium",
  },
};
